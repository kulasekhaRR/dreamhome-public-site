"""
Downloads one real OpenStreetMap location-context tile per unique mandal in
the properties dataset and stores it in the repo, then adds a `mandal_image`
path to every project record pointing at it.

Why a map tile and not a property photo: AP RERA's public registry (our only
free, legal data source — see fetch_rera_projects.py) does not publish
property photos, elevations or brochures. Both the approved-projects list
and an individual project's detail page were checked directly; neither
exposes real images, only regulatory filing data. Passing off a stock photo
as "the property" would be actively misleading, so this uses real map tiles
of each project's actual location instead — honest, free, and sourced
directly from OpenStreetMap (no API key, no billing).

Usage (run after fetch_rera_projects.py has produced the dataset):
    python3 fetch_mandal_images.py
"""

import json
import math
import re
import time
from pathlib import Path

import requests

OUT_DIR = Path(__file__).parent
REPO_ROOT = OUT_DIR.parent.parent
DATASET_FILE = OUT_DIR / "properties_visakhapatnam_district.json"
SITE_DATASET_FILE = REPO_ROOT / "public" / "data" / "rera-projects" / "visakhapatnam-district.json"
IMAGES_DIR = REPO_ROOT / "public" / "images" / "mandals"

ZOOM = 14
USER_AGENT = "Mozilla/5.0 (compatible; dreamhome-site/1.0; contact: hello@dreamhome.example)"
TILE_URL_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def lat_lon_to_tile(lat: float, lon: float, zoom: int) -> tuple[int, int]:
    n = 2**zoom
    x = int((lon + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    return x, y


def fetch_tile(x: int, y: int, zoom: int) -> bytes:
    url = TILE_URL_TEMPLATE.format(z=zoom, x=x, y=y)
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    resp.raise_for_status()
    return resp.content


def main():
    projects = json.loads(DATASET_FILE.read_text())
    unique_mandals = sorted({(p["mandal"], p["mandal_lat"], p["mandal_lon"]) for p in projects})
    print(f"{len(unique_mandals)} unique mandal locations to fetch tiles for")

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    slug_map: dict[str, str] = {}

    # Low volume (a dozen or so tiles) and sequential with a short delay —
    # well within OpenStreetMap's tile usage policy for non-bulk use.
    # https://operations.osmfoundation.org/policies/tiles/
    for mandal, lat, lon in unique_mandals:
        slug = slugify(mandal)
        out_path = IMAGES_DIR / f"{slug}.png"
        slug_map[mandal] = f"/images/mandals/{slug}.png"

        if out_path.exists():
            print(f"  {mandal}: already have {out_path.name}")
            continue

        x, y = lat_lon_to_tile(lat, lon, ZOOM)
        try:
            tile_bytes = fetch_tile(x, y, ZOOM)
            out_path.write_bytes(tile_bytes)
            print(f"  {mandal}: saved {out_path.name} ({len(tile_bytes)} bytes)")
        except Exception as exc:
            print(f"  {mandal}: FAILED — {exc}")
        time.sleep(1)

    for p in projects:
        p["mandal_image"] = slug_map.get(p["mandal"])

    DATASET_FILE.write_text(json.dumps(projects, indent=2, ensure_ascii=False))

    site_data = json.loads(SITE_DATASET_FILE.read_text())
    for p in site_data["projects"]:
        p["mandal_image"] = slug_map.get(p["mandal"])
    SITE_DATASET_FILE.write_text(json.dumps(site_data, indent=2, ensure_ascii=False))

    print(f"\nDone. {len(slug_map)} location images in {IMAGES_DIR}")
    print("Attribution required on-site: © OpenStreetMap contributors")


if __name__ == "__main__":
    main()
