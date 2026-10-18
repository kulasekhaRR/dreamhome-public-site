import { MapContainer, TileLayer } from 'react-leaflet'
import ClusterLayer from './map/ClusterLayer'
import type { Property } from '../types/property'

interface PropertyMapProps {
    properties: Property[]
    center: [number, number]
    zoom?: number
    onMarkerClick?: (property: Property) => void
    selectedId?: string | null
    className?: string
}

const PropertyMap = ({ properties, center, zoom = 11, onMarkerClick, selectedId, className }: PropertyMapProps) => (
    <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className={className || 'w-full h-full'}
        style={{ minHeight: '400px' }}
    >
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <ClusterLayer properties={properties} onMarkerClick={onMarkerClick} selectedId={selectedId} />
    </MapContainer>
)

export default PropertyMap
