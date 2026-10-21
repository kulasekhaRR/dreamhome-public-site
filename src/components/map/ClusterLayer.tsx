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

// Classic Google-Maps-style teardrop pin, not a plain circle.
const PIN_COLOR: Record<MapPin['kind'], string> = {
    listing: '#ea4335', // Google Maps red
    rera: '#0f1f3d', // brand navy — keeps the bulk RERA directory visually distinct
}

type HighlightState = 'none' | 'hovered' | 'selected'

const pinSvg = (color: string, size: number) => `
<svg width="${size}" height="${size * 1.36}" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
  <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 24 14 24s14-13.5 14-24c0-7.7-6.7-14-14-14z" fill="${color}"/>
  <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
</svg>`

const createDivIcon = (kind: MapPin['kind'], state: HighlightState) => {
    const color = state === 'selected' ? '#c9a227' : PIN_COLOR[kind]
    const size = state === 'none' ? 28 : state === 'hovered' ? 32 : 36
    return L.divIcon({
        className: '',
        html: pinSvg(color, size),
        iconSize: [size, size * 1.36],
        iconAnchor: [size / 2, size * 1.36],
        popupAnchor: [0, -size * 1.2],
    })
}

const ClusterLayer = ({ pins, onMarkerClick, onMarkerHover, selectedId, hoveredId }: ClusterLayerProps) => {
    const map = useMap()
    const markersRef = useRef<Map<string, L.Marker>>(new Map())
    const pinsRef = useRef<Map<string, MapPin>>(new Map())

    // Rebuild markers only when the pin set itself changes — not on every
    // hover, which would otherwise flicker/rebuild the whole layer.
    //
    // Listings are never clustered: there are only ~27 of them and several
    // share one locality's coordinates, so clustering would hide the exact
    // marker a hovered/clicked card needs to highlight. The (potentially
    // 2,048-strong) RERA directory still clusters, since that's genuinely
    // too dense to show as individual pins.
    useEffect(() => {
        const listingLayer = L.layerGroup()
        const reraCluster = L.markerClusterGroup({
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
                    <span style="font-size:12px;">${pin.badge}</span><br/>
                    <a href="${pin.linkTo}" style="font-size:12px;font-weight:600;color:${PIN_COLOR[pin.kind]};">View details &rarr;</a>
                </div>`,
            )
            marker.on('click', () => onMarkerClick?.(pin))
            marker.on('mouseover', () => onMarkerHover?.(pin))
            marker.on('mouseout', () => onMarkerHover?.(null))
            ;(pin.kind === 'listing' ? listingLayer : reraCluster).addLayer(marker)
            markers.set(pin.id, marker)
            pinsById.set(pin.id, pin)
        })

        markersRef.current = markers
        pinsRef.current = pinsById
        map.addLayer(listingLayer)
        map.addLayer(reraCluster)

        return () => {
            map.removeLayer(listingLayer)
            map.removeLayer(reraCluster)
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
            if (state !== 'none') marker.setZIndexOffset(1000)
            else marker.setZIndexOffset(0)
        })
    }, [selectedId, hoveredId])

    return null
}

export default ClusterLayer
