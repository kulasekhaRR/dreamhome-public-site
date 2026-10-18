// Reads the RERA-approved-projects dataset produced by
// scripts/rera_scraper/fetch_rera_projects.py. That script is run manually
// and writes its output straight into public/data/rera-projects/, which
// Vite serves as a static file — this just fetches it, same origin, free.

import type { PropertiesDataset } from '../types/property'
import { assetPath } from '../utils/assetPath'

const DATA_URL = assetPath('/data/rera-projects/visakhapatnam-district.json')

let cached: PropertiesDataset | null = null
let inflight: Promise<PropertiesDataset> | null = null

export async function fetchProperties(forceRefresh = false): Promise<PropertiesDataset> {
    if (cached && !forceRefresh) return cached
    if (inflight && !forceRefresh) return inflight

    const url = forceRefresh ? `${DATA_URL}?t=${Date.now()}` : DATA_URL
    inflight = fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error(`Failed to load properties data (${response.status})`)
            return response.json() as Promise<PropertiesDataset>
        })
        .then((data) => {
            cached = data
            return data
        })
        .finally(() => {
            inflight = null
        })

    return inflight
}

export function slugifyProject(reraId: string): string {
    return reraId.toLowerCase()
}
