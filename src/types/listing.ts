export interface Listing {
    id: string
    project_name: string
    facing: string
    area_sqft: number | null
    bhk: string
    price_per_sqft: number | null
    total_price_estimate: number | null
    amenities_count: number | null
    possession: string
    is_ready_to_move: boolean
    location: string
    is_exclusive: boolean
    description: string
    lat: number
    lon: number
    geocode_source: 'nominatim' | 'vizag_fallback'
    // A real OpenStreetMap location tile (not a photo of the property —
    // see scripts/listings/fetch_listings.py).
    location_image: string | null
}

export interface ListingsDataset {
    generatedAt: string
    source: string
    totalCount: number
    listings: Listing[]
}
