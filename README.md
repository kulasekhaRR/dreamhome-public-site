# DreamHome — Public Website

A homebuyer-facing website for DreamHome, covering new-construction projects, plots and ventures
across Visakhapatnam district — sourced directly from the official **AP RERA** registry
(rera.ap.gov.in), a public government source.

This is a separate, standalone project — it does not share code or credentials with any internal CRM.

## Stack (all free, no billing account required)

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **Routing:** React Router
- **Maps:** Leaflet + OpenStreetMap tiles + leaflet.markercluster — no API key, no Google Maps billing
- **Data:** a Python scraper (`scripts/rera_scraper/`) that pulls AP RERA's public approved-projects
  report and writes a static JSON file the site reads at runtime
- **Images:** real OpenStreetMap location tiles per locality (`scripts/rera_scraper/fetch_mandal_images.py`),
  stored in `public/images/mandals/`. AP RERA's registry has no property photos — this is deliberately a
  map of the real location, not a stock photo passed off as the property.

## Getting started

```bash
npm install
npm run dev
```

## Regenerating the properties dataset

```bash
cd scripts/rera_scraper
python3 fetch_rera_projects.py
```

This writes `public/data/rera-projects/seethammadhara-25km.json`, which the site fetches as a static
asset (no backend, no server-side API calls). Re-run it whenever you want fresher data, then restart
the dev server or redeploy.

To target a different locality/radius, edit `TARGET_DISTRICT`, `TARGET_LOCALITY` and `RADIUS_KM` at the
top of `fetch_rera_projects.py`.

After that, fetch location images for any new localities:

```bash
python3 fetch_mandal_images.py
```

This downloads one OpenStreetMap tile per unique locality into `public/images/mandals/` (skips ones
already downloaded) and adds a `mandal_image` path to every project record in both JSON copies.

## Pages

- `/` — Home, hero search, featured nearby projects
- `/properties` — full searchable/filterable listing (type, status, locality)
- `/properties/:reraId` — project detail page with an embedded map
- `/map` — full interactive map with a synced sidebar list
- `/about`, `/contact`

## Before going live

- `src/pages/Contact.tsx` has a placeholder contact email (`hello@dreamhome.example`) — replace it.
- Hosting: any static host works since there's no backend (Firebase Hosting, Netlify, Vercel, GitHub
  Pages all have free tiers that fit this project).
