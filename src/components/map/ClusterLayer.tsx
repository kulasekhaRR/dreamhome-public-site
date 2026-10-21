import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { MapPin } from '../../types/mapPin'

interface ClusterLayerProps {
    pins: MapPin[]
    onMarkerClick?: (pin: MapPin) => void
    onMarkerHover?: (pin: MapPin | null) => void
    selectedId?: string | null
    hoveredId?: string | null
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

type HighlightState = 'none' | 'hovered' | 'selected'

const createDivIcon = (kind: MapPin['kind'], state: HighlightState) => {
    if (state === 'selected') {
        return L.divIcon({
            className: '',
            html: `<div class="dh-marker-icon" style="background:#4c1d95;width:22px;height:22px;transform:translate(-3px,-3px);"></div>`,
            iconSize: [16, 16],
        })
    }
    if (state === 'hovered') {
        return L.divIcon({
            className: '',
            html: `<div class="dh-marker-icon" style="background:${PIN_COLOR[kind]};width:24px;height:24px;transform:translate(-4px,-4px);box-shadow:0 0 0 4px rgba(0,0,0,0.12);"></div>`,
            iconSize: [16, 16],
        })
    }
    return L.divIcon({
        className: '',
        html: `<div class="dh-marker-icon" style="background:${PIN_COLOR[kind]};"></div>`,
        iconSize: [16, 16],
    })
}

const ClusterLayer = ({ pins, onMarkerClick, onMarkerHover, selectedId, hoveredId }: ClusterLayerProps) => {
    const map = useMap()
    const markersRef = useRef<Map<string, L.Marker>>(new Map())
    const pinsRef = useRef<Map<string, MapPin>>(new Map())

    // Rebuild markers only when the pin set itself changes — not on every
    // hover, which would otherwise flicker/rebuild the whole cluster group.
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

        const markers = new Map<string, L.Marker>()
        const pinsById = new Map<string, MapPin>()

        pins.forEach((pin) => {
            const [dLat, dLon] = jitter(pin.id)
            const marker = L.marker([pin.lat + dLat, pin.lon + dLon], {
                icon: createDivIcon(pin.kind, 'none'),
            })
            marker.bindPopup(
                `<div style="font-family: Manrope, sans-serif; min-width:180px;">
                    <strong>${pin.title}</strong><br/>
                    <span style="color:#666;font-size:12px;">${pin.subtitle}</span><br/>
                    <span style="font-size:12px;">${pin.badge}</span>
                </div>`,
            )
            marker.on('click', () => onMarkerClick?.(pin))
            marker.on('mouseover', () => onMarkerHover?.(pin))
            marker.on('mouseout', () => onMarkerHover?.(null))
            clusterGroup.addLayer(marker)
            markers.set(pin.id, marker)
            pinsById.set(pin.id, pin)
        })

        markersRef.current = markers
        pinsRef.current = pinsById
        map.addLayer(clusterGroup)

        return () => {
            map.removeLayer(clusterGroup)
            markersRef.current = new Map()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, pins])

    // Cheap pass: just swap icons for the (at most two) markers whose
    // highlight state actually changed.
    useEffect(() => {
        markersRef.current.forEach((marker, id) => {
            const pin = pinsRef.current.get(id)
            if (!pin) return
            const state: HighlightState = id === selectedId ? 'selected' : id === hoveredId ? 'hovered' : 'none'
            marker.setIcon(createDivIcon(pin.kind, state))
        })
    }, [selectedId, hoveredId])

    return null
}

export default ClusterLayer
