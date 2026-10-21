import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchProperties } from '../services/propertiesService'
import { fetchListings } from '../services/listingsService'
import type { PropertiesDataset, Property } from '../types/property'
import type { ListingsDataset, Listing } from '../types/listing'
import type { MapPin } from '../types/mapPin'
import { propertyToPin, listingToPin } from '../utils/mapPins'
import PropertyCard from '../components/PropertyCard'
import ListingCard from '../components/ListingCard'
import PropertyMap from '../components/PropertyMap'
import SimpleMultiSelect from '../components/SimpleMultiSelect'
import RangeFilter from '../components/RangeFilter'
import { toTitleCase } from '../utils/format'

const RERA_PAGE_SIZE = 24
const SEETHAMMADHARA_CENTER: [number, number] = [17.745, 83.3062]

type NumOrEmpty = number | ''

const Properties = () => {
    const [searchParams] = useSearchParams()

    const [listingsData, setListingsData] = useState<ListingsDataset | null>(null)
    const [reraData, setReraData] = useState<PropertiesDataset | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [showReraSection, setShowReraSection] = useState(false)

    // Listings filters (every field the sheet actually gives us)
    const [selectedBhk, setSelectedBhk] = useState<string[]>([])
    const [selectedFacing, setSelectedFacing] = useState<string[]>([])
    const [selectedLocations, setSelectedLocations] = useState<string[]>([])
    const [readyToMoveOnly, setReadyToMoveOnly] = useState(false)
    const [priceMin, setPriceMin] = useState<NumOrEmpty>('')
    const [priceMax, setPriceMax] = useState<NumOrEmpty>('')
    const [areaMin, setAreaMin] = useState<NumOrEmpty>('')
    const [areaMax, setAreaMax] = useState<NumOrEmpty>('')

    // RERA directory filters
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [selectedMandals, setSelectedMandals] = useState<string[]>([])
    const [reraPage, setReraPage] = useState(1)

    const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    useEffect(() => {
        Promise.all([fetchListings(), fetchProperties()])
            .then(([listings, rera]) => {
                setListingsData(listings)
                setReraData(rera)
            })
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    const bhkOptions = useMemo(
        () =>
            Array.from(new Set(listingsData?.listings.map((l) => l.bhk) ?? []))
                .sort()
                .map((v) => ({ label: `${v} BHK`, value: v })),
        [listingsData],
    )
    const facingOptions = useMemo(() => {
        const all = new Set<string>()
        listingsData?.listings.forEach((l) => l.facing.split(',').forEach((f) => f.trim() && all.add(f.trim())))
        return Array.from(all)
            .sort()
            .map((v) => ({ label: `Facing ${v}`, value: v }))
    }, [listingsData])
    const locationOptions = useMemo(
        () =>
            Array.from(new Set(listingsData?.listings.map((l) => l.location).filter(Boolean) ?? []))
                .sort()
                .map((v) => ({ label: toTitleCase(v), value: v })),
        [listingsData],
    )

    const filteredListings = useMemo((): Listing[] => {
        if (!listingsData) return []
        const q = query.trim().toLowerCase()
        return listingsData.listings.filter((l) => {
            if (q && !l.project_name.toLowerCase().includes(q) && !l.location.toLowerCase().includes(q)) return false
            if (selectedBhk.length > 0 && !selectedBhk.includes(l.bhk)) return false
            if (selectedFacing.length > 0) {
                const parts = l.facing.split(',').map((f) => f.trim())
                if (!parts.some((f) => selectedFacing.includes(f))) return false
            }
            if (selectedLocations.length > 0 && !selectedLocations.includes(l.location)) return false
            if (readyToMoveOnly && !l.is_ready_to_move) return false
            if (priceMin !== '' && (l.total_price_estimate ?? 0) < priceMin * 100000) return false
            if (priceMax !== '' && (l.total_price_estimate ?? Infinity) > priceMax * 100000) return false
            if (areaMin !== '' && (l.area_sqft ?? 0) < areaMin) return false
            if (areaMax !== '' && (l.area_sqft ?? Infinity) > areaMax) return false
            return true
        })
    }, [
        listingsData,
        query,
        selectedBhk,
        selectedFacing,
        selectedLocations,
        readyToMoveOnly,
        priceMin,
        priceMax,
        areaMin,
        areaMax,
    ])

    const hasListingFilters =
        selectedBhk.length > 0 ||
        selectedFacing.length > 0 ||
        selectedLocations.length > 0 ||
        readyToMoveOnly ||
        priceMin !== '' ||
        priceMax !== '' ||
        areaMin !== '' ||
        areaMax !== ''

    const clearListingFilters = () => {
        setSelectedBhk([])
        setSelectedFacing([])
        setSelectedLocations([])
        setReadyToMoveOnly(false)
        setPriceMin('')
        setPriceMax('')
        setAreaMin('')
        setAreaMax('')
    }

    const typeOptions = useMemo(
        () =>
            Array.from(new Set(reraData?.projects.map((p) => p.project_type) ?? []))
                .sort()
                .map((v) => ({ label: v, value: v })),
        [reraData],
    )
    const statusOptions = useMemo(
        () =>
            Array.from(new Set(reraData?.projects.map((p) => p.status) ?? []))
                .sort()
                .map((v) => ({ label: v, value: v })),
        [reraData],
    )
    const mandalOptions = useMemo(
        () =>
            Array.from(new Set(reraData?.projects.map((p) => p.mandal) ?? []))
                .sort()
                .map((v) => ({ label: toTitleCase(v), value: v })),
        [reraData],
    )

    const filteredRera = useMemo((): Property[] => {
        if (!reraData) return []
        const q = query.trim().toLowerCase()
        return reraData.projects.filter((p) => {
            if (q && !p.project_name.toLowerCase().includes(q) && !p.place.toLowerCase().includes(q)) return false
            if (selectedTypes.length > 0 && !selectedTypes.includes(p.project_type)) return false
            if (selectedStatuses.length > 0 && !selectedStatuses.includes(p.status)) return false
            if (selectedMandals.length > 0 && !selectedMandals.includes(p.mandal)) return false
            return true
        })
    }, [reraData, query, selectedTypes, selectedStatuses, selectedMandals])

    useEffect(() => {
        setReraPage(1)
    }, [query, selectedTypes, selectedStatuses, selectedMandals])

    const reraTotalPages = Math.max(1, Math.ceil(filteredRera.length / RERA_PAGE_SIZE))
    const pagedRera = filteredRera.slice((reraPage - 1) * RERA_PAGE_SIZE, reraPage * RERA_PAGE_SIZE)

    // The map always shows every currently-visible listing pin, plus the
    // RERA section's pins once it's expanded (kept collapsed by default —
    // 2,048 projects would otherwise dominate both the map and the page).
    const mapPins = useMemo((): MapPin[] => {
        const pins = filteredListings.map(listingToPin)
        if (showReraSection) pins.push(...filteredRera.map(propertyToPin))
        return pins
    }, [filteredListings, filteredRera, showReraSection])

    return (
        <div className='flex flex-col lg:flex-row h-[calc(100vh-4rem)]'>
            {/* Map */}
            <div className='relative h-80 lg:h-full lg:w-1/2 xl:w-3/5 order-1 lg:order-none'>
                <PropertyMap
                    pins={mapPins}
                    center={SEETHAMMADHARA_CENTER}
                    zoom={11}
                    onMarkerClick={setSelectedPin}
                    onMarkerHover={(pin) => setHoveredId(pin?.id ?? null)}
                    selectedId={selectedPin?.id}
                    hoveredId={hoveredId}
                />

                {selectedPin && (
                    <div className='absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-[1000]'>
                        <div className='flex items-start justify-between gap-2'>
                            <h3 className='font-semibold text-gray-900 text-sm'>{selectedPin.title}</h3>
                            <button onClick={() => setSelectedPin(null)} className='text-gray-400 hover:text-gray-600'>
                                ✕
                            </button>
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>{selectedPin.subtitle}</p>
                        <a
                            href={selectedPin.linkTo}
                            className='inline-block mt-3 text-xs font-semibold text-brand-primary hover:underline'
                        >
                            View details →
                        </a>
                    </div>
                )}
            </div>

            {/* Listings */}
            <div className='flex-1 lg:w-1/2 xl:w-2/5 overflow-y-auto'>
                <div className='p-4 border-b border-gray-200 sticky top-0 bg-white z-10 space-y-3'>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Search project or locality...'
                        className='w-full h-10 px-4 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
                    />

                    <div className='flex flex-wrap items-center gap-2'>
                        <SimpleMultiSelect label='BHK' options={bhkOptions} selected={selectedBhk} onChange={setSelectedBhk} />
                        <SimpleMultiSelect label='Facing' options={facingOptions} selected={selectedFacing} onChange={setSelectedFacing} />
                        <SimpleMultiSelect label='Locality' options={locationOptions} selected={selectedLocations} onChange={setSelectedLocations} />
                        <RangeFilter label='Price (L)' min={priceMin} max={priceMax} onChange={(mn, mx) => { setPriceMin(mn); setPriceMax(mx) }} step={5} />
                        <RangeFilter label='Area (sqft)' min={areaMin} max={areaMax} onChange={(mn, mx) => { setAreaMin(mn); setAreaMax(mx) }} step={50} />
                        <button
                            onClick={() => setReadyToMoveOnly((v) => !v)}
                            className={`h-10 px-4 rounded-full border text-sm font-medium transition-colors ${
                                readyToMoveOnly
                                    ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                        >
                            Ready to move
                        </button>
                        {hasListingFilters && (
                            <button onClick={clearListingFilters} className='text-sm font-medium text-red-600 hover:underline'>
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                <div className='p-4'>
                    <div className='flex items-baseline justify-between mb-4'>
                        <h1 className='font-display text-2xl text-gray-900'>Exclusive Listings</h1>
                        <span className='text-xs text-gray-500'>{filteredListings.length} available</span>
                    </div>

                    {isLoading && (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10'>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className='h-56 rounded-2xl bg-gray-100 animate-pulse' />
                            ))}
                        </div>
                    )}

                    {!isLoading && (
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10'>
                            {filteredListings.map((listing) => {
                                const pinId = listingToPin(listing).id
                                return (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                        isHighlighted={hoveredId === pinId}
                                        onMouseEnter={() => setHoveredId(pinId)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    />
                                )
                            })}
                            {filteredListings.length === 0 && (
                                <p className='text-sm text-gray-400 col-span-2'>No exclusive listings match your filters.</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setShowReraSection((v) => !v)}
                        className='w-full flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                        <span>
                            {showReraSection ? 'Hide' : 'Show'} RERA-registered projects ({filteredRera.length.toLocaleString()})
                        </span>
                        <span className={`transition-transform ${showReraSection ? 'rotate-180' : ''}`}>▾</span>
                    </button>

                    {showReraSection && (
                        <div className='mt-4'>
                            <div className='flex flex-wrap items-center gap-2 mb-4'>
                                <SimpleMultiSelect label='Type' options={typeOptions} selected={selectedTypes} onChange={setSelectedTypes} />
                                <SimpleMultiSelect label='Status' options={statusOptions} selected={selectedStatuses} onChange={setSelectedStatuses} />
                                <SimpleMultiSelect label='Locality' options={mandalOptions} selected={selectedMandals} onChange={setSelectedMandals} />
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {pagedRera.map((property) => {
                                    const pinId = propertyToPin(property).id
                                    return (
                                        <PropertyCard
                                            key={property.rera_id}
                                            property={property}
                                            isHighlighted={hoveredId === pinId}
                                            onMouseEnter={() => setHoveredId(pinId)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        />
                                    )
                                })}
                            </div>

                            {reraTotalPages > 1 && (
                                <div className='flex items-center justify-center gap-2 mt-6'>
                                    <button
                                        disabled={reraPage === 1}
                                        onClick={() => setReraPage((p) => Math.max(1, p - 1))}
                                        className='h-9 px-4 rounded-full border border-gray-300 text-sm disabled:opacity-40'
                                    >
                                        Previous
                                    </button>
                                    <span className='text-sm text-gray-500'>
                                        Page {reraPage} of {reraTotalPages}
                                    </span>
                                    <button
                                        disabled={reraPage === reraTotalPages}
                                        onClick={() => setReraPage((p) => Math.min(reraTotalPages, p + 1))}
                                        className='h-9 px-4 rounded-full border border-gray-300 text-sm disabled:opacity-40'
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Properties
