import { MapContainer, TileLayer } from 'react-leaflet'
import ClusterLayer from './map/ClusterLayer'
import type { MapPin } from '../types/mapPin'

interface PropertyMapProps {
    pins: MapPin[]
    center: [number, number]
    zoom?: number
    onMarkerClick?: (pin: MapPin) => void
    onMarkerHover?: (pin: MapPin | null) => void
    selectedId?: string | null
    hoveredId?: string | null
    className?: string
}

// Esri's World Street Map (server.arcgisonline.com): free, no API key or
// account, and a warm road-map style close to Google Maps' classic look —
// unlike plain OSM tiles' flatter palette. (CARTO's basemap CDN now requires
// an API key — its tiles return an "API key required" placeholder image
// without one, confirmed when picking this.)
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const TILE_ATTRIBUTION =
    'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'

// Keeps the map at a city/locality level by default rather than zooming to
// street-level detail.
const DEFAULT_ZOOM = 11

const PropertyMap = ({
    pins,
    center,
    zoom = DEFAULT_ZOOM,
    onMarkerClick,
    onMarkerHover,
    selectedId,
    hoveredId,
    className,
}: PropertyMapProps) => (
    <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className={className || 'w-full h-full'}
        style={{ minHeight: '400px' }}
    >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} />
        <ClusterLayer
            pins={pins}
            onMarkerClick={onMarkerClick}
            onMarkerHover={onMarkerHover}
            selectedId={selectedId}
            hoveredId={hoveredId}
        />
    </MapContainer>
)

export default PropertyMap
