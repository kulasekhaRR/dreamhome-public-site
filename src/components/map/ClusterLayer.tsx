import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Property } from '../../types/property'

interface ClusterLayerProps {
    properties: Property[]
    onMarkerClick?: (property: Property) => void
    selectedId?: string | null
}

// Deterministic small jitter so projects sharing the same mandal centroid
// (this dataset's distance granularity — see PropertiesDataset) don't render
// as a single overlapping pin.
function jitter(seed: string, magnitude = 0.01): [number, number] {
    let hash = 0
    for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i)
    const angle = (hash % 360) * (Math.PI / 180)
    const radius = ((hash % 1000) / 1000) * magnitude
    return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

const createDivIcon = (highlighted: boolean) =>
    L.divIcon({
        className: '',
        html: `<div class="dh-marker-icon" style="${highlighted ? 'background:#4c1d95;width:22px;height:22px;transform:translate(-3px,-3px);' : ''}"></div>`,
        iconSize: [16, 16],
    })

const ClusterLayer = ({ properties, onMarkerClick, selectedId }: ClusterLayerProps) => {
    const map = useMap()
    const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)

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

        properties.forEach((property) => {
            const [dLat, dLon] = jitter(property.rera_id)
            const marker = L.marker([property.mandal_lat + dLat, property.mandal_lon + dLon], {
                icon: createDivIcon(property.rera_id === selectedId),
            })
            marker.bindPopup(
                `<div style="font-family: Manrope, sans-serif; min-width:180px;">
                    <strong>${property.project_name}</strong><br/>
                    <span style="color:#666;font-size:12px;">${property.place}</span><br/>
                    <span style="font-size:12px;">${property.project_type} · ${property.status}</span>
                </div>`,
            )
            if (onMarkerClick) {
                marker.on('click', () => onMarkerClick(property))
            }
            clusterGroup.addLayer(marker)
        })

        map.addLayer(clusterGroup)
        clusterGroupRef.current = clusterGroup

        return () => {
            map.removeLayer(clusterGroup)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, properties, selectedId])

    return null
}

export default ClusterLayer
