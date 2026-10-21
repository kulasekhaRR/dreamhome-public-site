// Generic map marker, built from either a curated Listing or a bulk RERA
// Property — lets the map components stay agnostic of the data source.
export interface MapPin {
    id: string
    title: string
    subtitle: string
    badge: string
    lat: number
    lon: number
    kind: 'listing' | 'rera'
    linkTo: string
}
