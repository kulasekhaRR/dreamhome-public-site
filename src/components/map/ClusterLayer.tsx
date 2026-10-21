import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { MapPin } from '../../types/mapPin'

interface ClusterLayerProps {
    pins: MapPin[]
    onMarkerClick?: (pin: MapPin) => void
    selectedId?: string | null
}

// Deterministic small jitter so pins sharing an approximate/shared centroid
// (mandal-level RERA data, or several listings in the same locality) don't
// render as a single overlapping marker.
function jitter(seed: string, magnitude = 0.01): [number, number] {
    let hash = 0
    for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i)
    const angle = (hash % 360) * (Math.PI / 180)
    const radius = ((hash % 1000) / 1000) * magnitude
    return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

const PIN_COLOR: Record<MapPin['kind'], string> = {
    listing: '#ffc72c',
    rera: '#6d28d9',
}

const createDivIcon = (kind: MapPin['kind'], highlighted: boolean) =>
    L.divIcon({
        className: '',
        html: `<div class="dh-marker-icon" style="background:${PIN_COLOR[kind]};${
            highlighted ? 'background:#4c1d95;width:22px;height:22px;transform:translate(-3px,-3px);' : ''
        }"></div>`,
        iconSize: [16, 16],
    })

const ClusterLayer = ({ pins, onMarkerClick, selectedId }: ClusterLayerProps) => {
    const map = useMap()

    useEffect(() => {
        const clusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            iconCreateFunction: (cluster) =>
                L.divIcon({
                    html: `<div class="dh-cluster-icon" style="width:${36 + Math.min(cluster.getChildCount(), 40)}px;height:${36 + Math.min(cluster.getChildCount(), 40)}px;">${cluster.getChildCount()}</div>`,
                    className: '',
                    iconSize: L.point(40, 40),
                }),
        })

        pins.forEach((pin) => {
            const [dLat, dLon] = jitter(pin.id)
            const marker = L.marker([pin.lat + dLat, pin.lon + dLon], {
                icon: createDivIcon(pin.kind, pin.id === selectedId),
            })
            marker.bindPopup(
                `<div style="font-family: Manrope, sans-serif; min-width:180px;">
                    <strong>${pin.title}</strong><br/>
                    <span style="color:#666;font-size:12px;">${pin.subtitle}</span><br/>
                    <span style="font-size:12px;">${pin.badge}</span>
                </div>`,
            )
            if (onMarkerClick) {
                marker.on('click', () => onMarkerClick(pin))
            }
            clusterGroup.addLayer(marker)
        })

        map.addLayer(clusterGroup)

        return () => {
            map.removeLayer(clusterGroup)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, pins, selectedId])

    return null
}

export default ClusterLayer
