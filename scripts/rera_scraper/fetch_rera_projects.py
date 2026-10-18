"""
Fetches the AP RERA (rera.ap.gov.in) statewide "Approved Projects" report,
filters it to a target district, geocodes each unique place via OpenStreetMap
Nominatim, and keeps only projects within a given radius of a target locality.

Data source: https://rera.ap.gov.in/RERA/Views/Reports/ApprovedProjects.aspx
This page is public, requires no auth, and returns the full report as static
HTML (no JS execution needed). No anti-bot protection was encountered.

Usage:
    python3 fetch_rera_projects.py
"""

import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

RERA_URL = "https://rera.ap.gov.in/RERA/Views/Reports/ApprovedProjects.aspx"
USER_AGENT = "Mozilla/5.0 (compatible; research-script/1.0)"

TARGET_DISTRICT = "Visakhapatnam"
TARGET_LOCALITY = "Seethammadhara, Visakhapatnam, Andhra Pradesh, India"
# None = no distance cutoff, keep every project in TARGET_DISTRICT (maximizes
# coverage). Set a number to filter to a radius around TARGET_LOCALITY instead.
RADIUS_KM = None

OUT_DIR = Path(__file__).parent
REPO_ROOT = OUT_DIR.parent.parent
RAW_HTML_CACHE = OUT_DIR / "rera_approved_projects_raw.html"
GEOCODE_CACHE_FILE = OUT_DIR / "geocode_cache.json"
OUTPUT_FILE = OUT_DIR / "properties_visakhapatnam_district.json"
# The website fetches this file at runtime as a static asset (Vite serves
# everything under public/ at the site root, in dev and after build).
SITE_OUTPUT_FILE = REPO_ROOT / "public" / "data" / "rera-projects" / "visakhapatnam-district.json"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


def fetch_rera_html() -> str:
    if RAW_HTML_CACHE.exists():
        print(f"Using cached HTML: {RAW_HTML_CACHE}")
        return RAW_HTML_CACHE.read_text(encoding="utf-8", errors="ignore")

    print("Fetching RERA approved projects report (this file is large, ~30MB)...")
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    resp = session.get(RERA_URL, timeout=120)
    resp.raise_for_status()
    RAW_HTML_CACHE.write_text(resp.text, encoding="utf-8")
    return resp.text


def parse_place(place: str):
    """Place format observed: 'Village (V), Mandal (M), District (D)'"""
    parts = [p.strip() for p in place.split(",")]
    village = mandal = district = ""
    for p in parts:
        if p.endswith("(V)"):
            village = p[:-3].strip()
        elif p.endswith("(M)"):
            mandal = p[:-3].strip()
        elif p.endswith("(D)"):
            district = p[:-3].strip()
    return village, mandal, district


def parse_projects(html: str):
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find(id="ContentPlaceHolder1_gvApprovedProject")
    if table is None:
        raise RuntimeError("Could not find approved projects table in the page")

    rows = table.find("tbody").find_all("tr", recursive=False)
    projects = []
    for row in rows:
        cells = row.find_all("td", recursive=False)
        if len(cells) < 8:
            continue
        reg_id = cells[1].get_text(strip=True)
        name = cells[2].get_text(strip=True)
        place = cells[3].get_text(strip=True)
        ptype = cells[4].get_text(strip=True)
        status = cells[5].get_text(strip=True)
        approval_date = cells[6].get_text(strip=True)
        exp_completion = cells[7].get_text(strip=True)

        village, mandal, district = parse_place(place)
        projects.append(
            {
                "rera_id": reg_id,
                "project_name": name,
                "place": place,
                "village": village,
                "mandal": mandal,
                "district": district,
                "project_type": ptype,
                "status": status,
                "approval_date": approval_date,
                "expected_completion": exp_completion,
            }
        )
    return projects


def geocode(query: str, cache: dict) -> dict | None:
    if query in cache:
        return cache[query]

    time.sleep(1.1)  # Nominatim usage policy: max 1 req/sec
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


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def geocode_mandal(mandal: str, cache: dict) -> dict | None:
    """Geocode a mandal name with district-qualifier fallbacks.

    AP's 2022 reorganization split old Visakhapatnam district into
    Visakhapatnam / Anakapalli / Alluri Sitharama Raju districts. RERA data
    still uses the old undivided district name, but OSM/Nominatim reflects
    the new boundaries — so a bare "{mandal}, Andhra Pradesh, India" query
    can match a wrong, same-named place elsewhere in the state (seen: it
    matched an "Anakapalli" ~170km away instead of the real one near Vizag).
    Try the most specific qualifiers first and only fall back to the bare
    query if those come up empty.
    """
    for qualifier in ("Visakhapatnam district", "Anakapalli district", None):
        query = f"{mandal}, {qualifier}, Andhra Pradesh, India" if qualifier else f"{mandal}, Andhra Pradesh, India"
        result = geocode(query, cache)
        if result:
            return result
    return None


def load_cache(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {}


def save_cache(path: Path, cache: dict):
    path.write_text(json.dumps(cache, indent=2))


def main():
    html = fetch_rera_html()
    all_projects = parse_projects(html)
    print(f"Parsed {len(all_projects)} total RERA projects statewide")

    district_projects = [
        p for p in all_projects if TARGET_DISTRICT.lower() in p["district"].lower()
    ]
    print(f"{len(district_projects)} projects in {TARGET_DISTRICT} district")

    geo_cache = load_cache(GEOCODE_CACHE_FILE)

    target = geocode(TARGET_LOCALITY, geo_cache)
    if target is None:
        raise RuntimeError(f"Could not geocode target locality: {TARGET_LOCALITY}")
    print(f"Target locality resolved to: {target}")

    # Geocode at mandal level (administrative town), not raw village name.
    # Nominatim frequently can't resolve small village names and silently
    # falls back to a broader match (e.g. the district centroid), which
    # would make every unresolved village look like it's "near" the target.
    # Mandals are towns and resolve far more reliably.
    unique_mandals = sorted({p["mandal"] for p in district_projects if p["mandal"]})
    print(f"Geocoding {len(unique_mandals)} unique mandals (rate-limited to 1/sec)...")

    mandal_locations: dict[str, dict] = {}
    for i, mandal in enumerate(unique_mandals, 1):
        loc = geocode_mandal(mandal, geo_cache)
        if loc:
            mandal_locations[mandal] = loc
        if i % 20 == 0:
            print(f"  ...{i}/{len(unique_mandals)} geocoded")
            save_cache(GEOCODE_CACHE_FILE, geo_cache)

    save_cache(GEOCODE_CACHE_FILE, geo_cache)

    results = []
    skipped_no_geocode = 0
    for p in district_projects:
        loc = mandal_locations.get(p["mandal"])
        if not loc:
            skipped_no_geocode += 1
            continue
        dist = haversine_km(target["lat"], target["lon"], loc["lat"], loc["lon"])
        if RADIUS_KM is None or dist <= RADIUS_KM:
            entry = dict(p)
            entry["mandal_lat"] = loc["lat"]
            entry["mandal_lon"] = loc["lon"]
            entry["distance_km_from_target_mandal_level"] = round(dist, 2)
            results.append(entry)
    print(f"Skipped {skipped_no_geocode} projects whose mandal could not be geocoded")

    results.sort(key=lambda x: x["distance_km_from_target_mandal_level"])

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    scope = f"within {RADIUS_KM}km of {TARGET_LOCALITY}" if RADIUS_KM is not None else f"across {TARGET_DISTRICT} district"
    print(f"\n{len(results)} projects {scope}")
    print("NOTE: distance is computed at mandal (town) level, not exact village/project location")
    print(f"Written to {OUTPUT_FILE}")

    envelope = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": RERA_URL,
        "targetLocality": TARGET_LOCALITY,
        "targetDistrict": TARGET_DISTRICT,
        "radiusKm": RADIUS_KM,
        "scopeLabel": f"{TARGET_DISTRICT} district" if RADIUS_KM is None else f"{RADIUS_KM}km of {TARGET_LOCALITY}",
        "distanceGranularity": "mandal",
        "totalCount": len(results),
        "projects": results,
    }
    SITE_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    SITE_OUTPUT_FILE.write_text(json.dumps(envelope, indent=2, ensure_ascii=False))
    print(f"Written site copy to {SITE_OUTPUT_FILE}")


if __name__ == "__main__":
    main()
