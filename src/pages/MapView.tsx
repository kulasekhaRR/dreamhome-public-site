import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { fetchProperties } from '../services/propertiesService'
import type { Property, PropertiesDataset } from '../types/property'
import ClusterLayer from '../components/map/ClusterLayer'
import FlyToController from '../components/map/FlyToController'
import SimpleMultiSelect from '../components/SimpleMultiSelect'
import { toTitleCase } from '../utils/format'

const SEETHAMMADHARA_CENTER: [number, number] = [17.745, 83.3062]

const MapView = () => {
    const [data, setData] = useState<PropertiesDataset | null>(null)
    const [query, setQuery] = useState('')
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selected, setSelected] = useState<Property | null>(null)
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)

    useEffect(() => {
        fetchProperties().then(setData).catch(console.error)
    }, [])

    const typeOptions = useMemo(
        () =>
            Array.from(new Set(data?.projects.map((p) => p.project_type) ?? []))
                .sort()
                .map((v) => ({ label: v, value: v })),
        [data],
    )

    const filtered = useMemo(() => {
        if (!data) return []
        const q = query.trim().toLowerCase()
        return data.projects.filter((p) => {
            if (q && !p.project_name.toLowerCase().includes(q) && !p.place.toLowerCase().includes(q)) return false
            if (selectedTypes.length > 0 && !selectedTypes.includes(p.project_type)) return false
            return true
        })
    }, [data, query, selectedTypes])

    const handleCardClick = (property: Property) => {
        setSelected(property)
        setFlyTarget([property.mandal_lat, property.mandal_lon])
    }

    return (
        <div className='flex flex-col lg:flex-row h-[calc(100vh-4rem)]'>
            {/* Sidebar */}
            <aside className='w-full lg:w-96 shrink-0 border-r border-gray-200 flex flex-col'>
                <div className='p-4 border-b border-gray-200 space-y-3'>
                    <h1 className='font-display text-xl text-gray-900'>Properties Map</h1>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Search...'
                        className='w-full h-9 px-3 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
                    />
                    <SimpleMultiSelect label='Type' options={typeOptions} selected={selectedTypes} onChange={setSelectedTypes} />
                    <p className='text-xs text-gray-400'>{filtered.length.toLocaleString()} projects shown</p>
                </div>

                <div className='flex-1 overflow-y-auto no-scrollbar'>
                    {filtered.map((property) => (
                        <button
                            key={property.rera_id}
                            onClick={() => handleCardClick(property)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                selected?.rera_id === property.rera_id ? 'bg-brand-primary/5' : ''
                            }`}
                        >
                            <div className='text-sm font-semibold text-gray-900 line-clamp-1'>
                                {toTitleCase(property.project_name)}
                            </div>
                            <div className='text-xs text-gray-500 line-clamp-1 mt-0.5'>{property.place}</div>
                            <div className='flex items-center justify-between mt-1'>
                                <span className='text-xs text-gray-400'>{property.project_type}</span>
                                <span className='text-xs text-gray-400'>
                                    ~{property.distance_km_from_target_mandal_level}km
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Map */}
            <div className='flex-1 relative'>
                <MapContainer center={SEETHAMMADHARA_CENTER} zoom={11} scrollWheelZoom className='w-full h-full'>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    />
                    <ClusterLayer properties={filtered} onMarkerClick={handleCardClick} selectedId={selected?.rera_id} />
                    <FlyToController target={flyTarget} />
                </MapContainer>

                {selected && (
                    <div className='absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-[1000]'>
                        <div className='flex items-start justify-between gap-2'>
                            <h3 className='font-semibold text-gray-900 text-sm'>{toTitleCase(selected.project_name)}</h3>
                            <button onClick={() => setSelected(null)} className='text-gray-400 hover:text-gray-600'>
                                ✕
                            </button>
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>{selected.place}</p>
                        <Link
                            to={`/properties/${selected.rera_id.toLowerCase()}`}
                            className='inline-block mt-3 text-xs font-semibold text-brand-primary hover:underline'
                        >
                            View details →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MapView
