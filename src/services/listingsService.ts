// Curated broker listings (a partner's hand-picked inventory), sourced from
// a shared Google Sheet via scripts/listings/fetch_listings.py.
//
// Interim data source: a static JSON file (same pattern as propertiesService.ts).
// Once the Firebase project exists, this will move to a Firestore `listings`
// collection instead — this data is actively curated/updated (unlike the bulk
// RERA scrape), so it benefits from live edits without a redeploy. The
// function signature below is deliberately backend-agnostic so swapping the
// implementation won't require touching any component that calls it.

import type { ListingsDataset } from '../types/listing'
import { assetPath } from '../utils/assetPath'

const DATA_URL = assetPath('/data/listings/listings.json')

let cached: ListingsDataset | null = null

export async function fetchListings(forceRefresh = false): Promise<ListingsDataset> {
    if (cached && !forceRefresh) return cached

    const url = forceRefresh ? `${DATA_URL}?t=${Date.now()}` : DATA_URL
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to load listings data (${response.status})`)
    }
    const data = (await response.json()) as ListingsDataset
    cached = data
    return data
}
