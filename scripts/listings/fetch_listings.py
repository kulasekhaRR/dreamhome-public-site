"""
Pulls the curated listings data from the shared Google Sheet (exported as
public CSV — no API key needed), geocodes each listing's locality via
OpenStreetMap Nominatim, and writes a structured JSON file.

These are hand-curated broker listings (a friend's inventory), distinct from
the bulk AP RERA directory (see scripts/rera_scraper/). They're shown first
on the site, with the RERA directory below as secondary/bulk reference data.

Usage:
    python3 fetch_listings.py
"""

import csv
import io
import json
import math
import re
import time
from pathlib import Path

import requests

SHEET_ID = "1NFKx_26UqOYBG70f8yO3gfga35D1xwxSciXS71zbObE"
SHEET_CSV_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv"
USER_AGENT = "Mozilla/5.0 (compatible; dreamhome-site/1.0; contact: hello@dreamhome.example)"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Visakhapatnam city centre — fallback for listings whose locality can't be
# geocoded (there is no lat/lng column in the source sheet at all).
VIZAG_FALLBACK = {"lat": 17.6868, "lon": 83.2185}

# The sheet has a couple of informal spellings Nominatim doesn't recognize.
LOCATION_ALIASES = {
    "Seethammadhaara": "Seethammadhara",
}

OUT_DIR = Path(__file__).parent
REPO_ROOT = OUT_DIR.parent.parent
RAW_CSV_CACHE = OUT_DIR / "raw_listings.csv"
GEOCODE_CACHE_FILE = OUT_DIR / "geocode_cache.json"
OUTPUT_FILE = OUT_DIR / "listings.json"
SITE_OUTPUT_FILE = REPO_ROOT / "public" / "data" / "listings" / "listings.json"
IMAGES_DIR = REPO_ROOT / "public" / "images" / "localities"
TILE_ZOOM = 15
TILE_URL_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"


def fetch_csv() -> str:
    if RAW_CSV_CACHE.exists():
        print(f"Using cached CSV: {RAW_CSV_CACHE}")
        return RAW_CSV_CACHE.read_text(encoding="utf-8")

    resp = requests.get(SHEET_CSV_URL, headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()
    RAW_CSV_CACHE.write_text(resp.text, encoding="utf-8")
    return resp.text


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def load_cache(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {}


def save_cache(path: Path, cache: dict):
    path.write_text(json.dumps(cache, indent=2))


def geocode_location(location: str, cache: dict) -> dict | None:
    if not location:
        return None
    location = LOCATION_ALIASES.get(location, location)
    query = f"{location}, Visakhapatnam, Andhra Pradesh, India"
    if query in cache:
        return cache[query]

    time.sleep(1.1)
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": query, "format": "json", "limit": 1, "countrycodes": "in"},
            headers={"User-Agent": USER_AGENT},
            timeout=20,
        )
        resp.raise_for_status()
        results = resp.json()
    except Exception as exc:
        print(f"  geocode failed for '{query}': {exc}")
        cache[query] = None
        return None

    if not results:
        cache[query] = None
        return None

    result = {"lat": float(results[0]["lat"]), "lon": float(results[0]["lon"])}
    cache[query] = result
    return result


def lat_lon_to_tile(lat: float, lon: float, zoom: int) -> tuple[int, int]:
    n = 2**zoom
    x = int((lon + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    return x, y


def fetch_locality_image(location: str, lat: float, lon: float) -> str:
    """Downloads one real OpenStreetMap tile for this locality (not a photo
    of the property — see the module docstring in fetch_mandal_images.py for
    why). Low volume (a handful of localities), so this stays well within
    OSM's tile usage policy."""
    slug = slugify(location) if location else slugify(f"{lat}-{lon}")
    out_path = IMAGES_DIR / f"{slug}.png"
    if not out_path.exists():
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        x, y = lat_lon_to_tile(lat, lon, TILE_ZOOM)
        url = TILE_URL_TEMPLATE.format(z=TILE_ZOOM, x=x, y=y)
        resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
        resp.raise_for_status()
        out_path.write_bytes(resp.content)
        print(f"  locality image: saved {out_path.name}")
        time.sleep(1)
    return f"/images/localities/{slug}.png"


def parse_int(value: str) -> int | None:
    if not value:
        return None
    digits = re.sub(r"[^\d]", "", value)
    return int(digits) if digits else None


def parse_float(value: str) -> float | None:
    try:
        return float(value) if value else None
    except ValueError:
        return None


def main():
    csv_text = fetch_csv()
    rows = list(csv.DictReader(io.StringIO(csv_text)))
    rows = [r for r in rows if r.get("Project")]
    print(f"Parsed {len(rows)} listings from the sheet")

    geo_cache = load_cache(GEOCODE_CACHE_FILE)
    unique_locations = sorted({r["Location"].strip() for r in rows if r.get("Location", "").strip()})
    print(f"Geocoding {len(unique_locations)} unique localities...")
    location_images: dict[str, str] = {}
    for loc in unique_locations:
        geo = geocode_location(loc, geo_cache)
        coords = geo or VIZAG_FALLBACK
        location_images[loc] = fetch_locality_image(loc, coords["lat"], coords["lon"])
    save_cache(GEOCODE_CACHE_FILE, geo_cache)

    seen_slugs: dict[str, int] = {}
    listings = []
    for row in rows:
        project = row["Project"].strip()
        slug = slugify(project)
        seen_slugs[slug] = seen_slugs.get(slug, 0) + 1
        listing_id = slug if seen_slugs[slug] == 1 else f"{slug}-{seen_slugs[slug]}"

        location = row.get("Location", "").strip()
        geo = geocode_location(location, geo_cache) if location else None
        used_fallback = geo is None
        coords = geo or VIZAG_FALLBACK

        area_sqft = parse_int(row.get("Area", ""))
        price_per_sqft = parse_int(row.get("Price_per_sft", ""))
        possession = row.get("Possession", "").strip()

        listings.append(
            {
                "id": listing_id,
                "project_name": project,
                "facing": row.get("Facing", "").strip(),
                "area_sqft": area_sqft,
                "bhk": row.get("BHK", "").strip(),
                "price_per_sqft": price_per_sqft,
                "total_price_estimate": (
                    area_sqft * price_per_sqft if area_sqft and price_per_sqft else None
                ),
                "amenities_count": parse_float(row.get("Amenities(L)", "")),
                "possession": possession,
                "is_ready_to_move": possession.lower() == "given",
                "location": location,
                "is_exclusive": row.get("Exclusive", "").strip() == "1",
                "description": row.get("Desc", "").strip(),
                "lat": coords["lat"],
                "lon": coords["lon"],
                "geocode_source": "vizag_fallback" if used_fallback else "nominatim",
                "location_image": location_images.get(location),
            }
        )

    OUTPUT_FILE.write_text(json.dumps(listings, indent=2, ensure_ascii=False))
    print(f"Written {len(listings)} listings to {OUTPUT_FILE}")

    fallback_count = sum(1 for listing in listings if listing["geocode_source"] == "vizag_fallback")
    print(f"{fallback_count} listings fell back to the Vizag city-centre coordinate")

    envelope = {
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "source": "Google Sheet (curated by a partner broker)",
        "totalCount": len(listings),
        "listings": listings,
    }
    SITE_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    SITE_OUTPUT_FILE.write_text(json.dumps(envelope, indent=2, ensure_ascii=False))
    print(f"Written site copy to {SITE_OUTPUT_FILE}")


if __name__ == "__main__":
    main()
