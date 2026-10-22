export interface Listing {
    id: string
    project_name: string
    facing: string
    area_sqft: number | null
    bhk: string
    price_per_sqft: number | null
    // Includes the amenities charge (see amenities_value_lakhs) on top of
    // area * price_per_sqft.
    total_price_estimate: number | null
    // An additional amenities charge, in lakhs of rupees — not a count of
    // amenities features.
    amenities_value_lakhs: number | null
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
