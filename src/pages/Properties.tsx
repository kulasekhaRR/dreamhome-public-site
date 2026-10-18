import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProperties } from '../services/propertiesService'
import type { PropertiesDataset } from '../types/property'
import PropertyCard from '../components/PropertyCard'
import SimpleMultiSelect from '../components/SimpleMultiSelect'
import { toTitleCase } from '../utils/format'

const PAGE_SIZE = 24

const Properties = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [data, setData] = useState<PropertiesDataset | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [selectedMandals, setSelectedMandals] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<'distance' | 'name'>('distance')
    const [page, setPage] = useState(1)

    useEffect(() => {
        fetchProperties()
            .then(setData)
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    const typeOptions = useMemo(
        () =>
            Array.from(new Set(data?.projects.map((p) => p.project_type) ?? []))
                .sort()
                .map((v) => ({ label: v, value: v })),
        [data],
    )
    const statusOptions = useMemo(
        () =>
            Array.from(new Set(data?.projects.map((p) => p.status) ?? []))
                .sort()
                .map((v) => ({ label: v, value: v })),
        [data],
    )
    const mandalOptions = useMemo(
        () =>
            Array.from(new Set(data?.projects.map((p) => p.mandal) ?? []))
                .sort()
                .map((v) => ({ label: toTitleCase(v), value: v })),
        [data],
    )

    const filtered = useMemo(() => {
        if (!data) return []
        const q = query.trim().toLowerCase()
        let results = data.projects.filter((p) => {
            if (q && !p.project_name.toLowerCase().includes(q) && !p.place.toLowerCase().includes(q)) return false
            if (selectedTypes.length > 0 && !selectedTypes.includes(p.project_type)) return false
            if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false
            if (selectedMandals.length > 0 && !selectedMandals.includes(p.mandal)) return false
            return true
        })
        results = [...results].sort((a, b) =>
            sortBy === 'distance'
                ? a.distance_km_from_target_mandal_level - b.distance_km_from_target_mandal_level
                : a.project_name.localeCompare(b.project_name),
        )
        return results
    }, [data, query, selectedTypes, selectedStatuses, selectedMandals, sortBy])

    useEffect(() => {
        setPage(1)
    }, [query, selectedTypes, selectedStatuses, selectedMandals])

    useEffect(() => {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        setSearchParams(params, { replace: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const clearAll = () => {
        setQuery('')
        setSelectedTypes([])
        setSelectedStatuses([])
        setSelectedMandals([])
    }
    const hasFilters = Boolean(query || selectedTypes.length || selectedStatuses.length || selectedMandals.length)

    return (
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12'>
            <div className='mb-8'>
                <h1 className='font-display text-3xl text-gray-900'>All Properties</h1>
                <p className='text-gray-500 mt-2'>
                    {data ? `${filtered.length.toLocaleString()} of ${data.totalCount.toLocaleString()}` : '…'}{' '}
                    RERA-registered projects across Visakhapatnam district
                </p>
            </div>

            <div className='flex flex-wrap items-center gap-3 mb-8'>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Search project or locality...'
                    className='h-10 px-4 rounded-full border border-gray-300 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-brand-primary'
                />
                <SimpleMultiSelect label='Type' options={typeOptions} selected={selectedTypes} onChange={setSelectedTypes} />
                <SimpleMultiSelect label='Status' options={statusOptions} selected={selectedStatuses} onChange={setSelectedStatuses} />
                <SimpleMultiSelect label='Locality' options={mandalOptions} selected={selectedMandals} onChange={setSelectedMandals} />

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'distance' | 'name')}
                    className='h-10 px-4 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
                >
                    <option value='distance'>Sort: Nearest first</option>
                    <option value='name'>Sort: Name (A–Z)</option>
                </select>

                {hasFilters && (
                    <button onClick={clearAll} className='text-sm font-medium text-red-600 hover:underline'>
                        Clear filters
                    </button>
                )}
            </div>

            {isLoading && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className='h-56 rounded-2xl bg-gray-100 animate-pulse' />
                    ))}
                </div>
            )}

            {!isLoading && filtered.length === 0 && (
                <div className='text-center py-20 text-gray-500'>No properties match your filters.</div>
            )}

            {!isLoading && filtered.length > 0 && (
                <>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {paged.map((property) => (
                            <PropertyCard key={property.rera_id} property={property} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className='flex items-center justify-center gap-2 mt-10'>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className='h-9 px-4 rounded-full border border-gray-300 text-sm disabled:opacity-40'
                            >
                                Previous
                            </button>
                            <span className='text-sm text-gray-500'>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className='h-9 px-4 rounded-full border border-gray-300 text-sm disabled:opacity-40'
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Properties
