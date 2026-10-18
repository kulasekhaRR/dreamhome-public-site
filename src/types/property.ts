export interface Property {
    rera_id: string
    project_name: string
    place: string
    village: string
    mandal: string
    district: string
    project_type: string
    status: string
    approval_date: string
    expected_completion: string
    mandal_lat: number
    mandal_lon: number
    distance_km_from_target_mandal_level: number
    // A real OpenStreetMap location tile for this project's locality (not a
    // photo of the property itself — AP RERA's registry has none). See
    // scripts/rera_scraper/fetch_mandal_images.py.
    mandal_image: string | null
}

export interface PropertiesDataset {
    generatedAt: string
    source: string
    targetLocality: string
    targetDistrict: string
    radiusKm: number | null
    scopeLabel: string
    distanceGranularity: string
    totalCount: number
    projects: Property[]
}
