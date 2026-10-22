import { useEffect, useMemo, useRef, useState } from 'react'
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
import FilterChatbot from '../components/FilterChatbot'
import { toTitleCase } from '../utils/format'
import type { ParsedChatFilters } from '../utils/chatFilterParser'

const RERA_PAGE_SIZE = 24
const SEETHAMMADHARA_CENTER: [number, number] = [17.745, 83.3062]

type NumOrEmpty = number | ''

// Comma-joined list <-> URL param helpers, and the param keys everything
// below is persisted under. Filters live in the URL (not just component
// state) specifically so that navigating to a listing/property and back
// restores them — plain useState resets on remount, which is exactly the
// "filters clear when I go back" bug.
const listParam = (params: URLSearchParams, key: string): string[] => {
    const raw = params.get(key)
    return raw ? raw.split(',').filter(Boolean) : []
}
const numParam = (params: URLSearchParams, key: string): NumOrEmpty => {
    const raw = params.get(key)
    if (!raw) return ''
    const n = Number(raw)
    return Number.isFinite(n) ? n : ''
}

const Properties = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    const [listingsData, setListingsData] = useState<ListingsDataset | null>(null)
    const [reraData, setReraData] = useState<PropertiesDataset | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [showReraSection, setShowReraSection] = useState(searchParams.get('rera') === '1')
    const [showMapMobile, setShowMapMobile] = useState(true)

    // Listings filters (every field the sheet actually gives us)
    const [selectedBhk, setSelectedBhk] = useState<string[]>(() => listParam(searchParams, 'bhk'))
    const [selectedFacing, setSelectedFacing] = useState<string[]>(() => listParam(searchParams, 'facing'))
    const [selectedLocations, setSelectedLocations] = useState<string[]>(() => listParam(searchParams, 'loc'))
    const [readyToMoveOnly, setReadyToMoveOnly] = useState(searchParams.get('ready') === '1')
    const [priceMin, setPriceMin] = useState<NumOrEmpty>(() => numParam(searchParams, 'pmin'))
    const [priceMax, setPriceMax] = useState<NumOrEmpty>(() => numParam(searchParams, 'pmax'))
    const [areaMin, setAreaMin] = useState<NumOrEmpty>(() => numParam(searchParams, 'amin'))
    const [areaMax, setAreaMax] = useState<NumOrEmpty>(() => numParam(searchParams, 'amax'))

    // RERA directory filters
    const [selectedTypes, setSelectedTypes] = useState<string[]>(() => listParam(searchParams, 'type'))
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => listParam(searchParams, 'status'))
    const [selectedMandals, setSelectedMandals] = useState<string[]>(() => listParam(searchParams, 'mandal'))
    const [reraPage, setReraPage] = useState(() => Number(searchParams.get('page')) || 1)

    // Clicking a map pin isolates that one listing/project in the panel —
    // it doesn't just pop up a floating card. Not persisted to the URL:
    // it's a transient map interaction, not a filter.
    const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    // Keep the URL in sync with every filter so the back button (or our own
    // card links) restores exactly this state instead of a blank slate.
    useEffect(() => {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (selectedBhk.length) params.set('bhk', selectedBhk.join(','))
        if (selectedFacing.length) params.set('facing', selectedFacing.join(','))
        if (selectedLocations.length) params.set('loc', selectedLocations.join(','))
        if (readyToMoveOnly) params.set('ready', '1')
        if (priceMin !== '') params.set('pmin', String(priceMin))
        if (priceMax !== '') params.set('pmax', String(priceMax))
        if (areaMin !== '') params.set('amin', String(areaMin))
        if (areaMax !== '') params.set('amax', String(areaMax))
        if (showReraSection) params.set('rera', '1')
        if (selectedTypes.length) params.set('type', selectedTypes.join(','))
        if (selectedStatuses.length) params.set('status', selectedStatuses.join(','))
        if (selectedMandals.length) params.set('mandal', selectedMandals.join(','))
        if (reraPage > 1) params.set('page', String(reraPage))
        setSearchParams(params, { replace: true })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        query,
        selectedBhk,
        selectedFacing,
        selectedLocations,
        readyToMoveOnly,
        priceMin,
        priceMax,
        areaMin,
        areaMax,
        showReraSection,
        selectedTypes,
        selectedStatuses,
        selectedMandals,
        reraPage,
    ])

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

    // Resets to page 1 on filter changes, but not on the initial mount —
    // otherwise a page number restored from the URL (after navigating back
    // from a property) would immediately get stomped back to 1.
    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
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

    // Clicking a map pin isolates that single item in its panel section
    // rather than just popping up a floating card.
    const isolatedListing =
        selectedPin?.kind === 'listing'
            ? (listingsData?.listings.find((l) => listingToPin(l).id === selectedPin.id) ?? null)
            : null
    const isolatedProperty =
        selectedPin?.kind === 'rera'
            ? (reraData?.projects.find((p) => propertyToPin(p).id === selectedPin.id) ?? null)
            : null

    const listingsToShow = isolatedListing ? [isolatedListing] : filteredListings
    const reraToShow = isolatedProperty ? [isolatedProperty] : pagedRera

    const handlePinClick = (pin: MapPin) => {
        setSelectedPin(pin)
        if (pin.kind === 'rera') setShowReraSection(true)
    }

    const handleChatApply = (filters: ParsedChatFilters) => {
        if (filters.bhk) setSelectedBhk([filters.bhk])
        if (filters.facing) setSelectedFacing([filters.facing])
        if (filters.location) setSelectedLocations([filters.location])
        if (filters.readyToMove) setReadyToMoveOnly(true)
        if (filters.priceMinLakhs !== undefined) setPriceMin(filters.priceMinLakhs)
        if (filters.priceMaxLakhs !== undefined) setPriceMax(filters.priceMaxLakhs)
        setSelectedPin(null)
    }

    return (
        <div className='flex flex-col lg:flex-row h-[calc(100vh-4rem)]'>
            {/* Map */}
            <div
                className={`relative lg:h-full lg:w-1/2 xl:w-3/5 order-1 lg:order-none ${showMapMobile ? 'h-80 lg:h-full' : 'h-0 lg:h-full'} transition-[height] duration-200 overflow-hidden`}
            >
                <PropertyMap
                    pins={mapPins}
                    center={SEETHAMMADHARA_CENTER}
                    zoom={11}
                    onMarkerClick={handlePinClick}
                    onMarkerHover={(pin) => setHoveredId(pin?.id ?? null)}
                    selectedId={selectedPin?.id}
                    hoveredId={hoveredId}
                />
            </div>

            {/* Mobile-only map visibility toggle — the map defaults to
                visible, but on small screens it's worth being able to
                reclaim the vertical space for listings. */}
            <button
                onClick={() => setShowMapMobile((v) => !v)}
                className='lg:hidden order-2 flex items-center justify-center gap-2 h-10 border-b border-gray-200 text-sm font-medium text-brand-primary bg-white'
            >
                {showMapMobile ? '▲ Hide map' : '▼ Show map'}
            </button>

            {/* Listings */}
            <div className='order-3 lg:order-none flex-1 lg:w-1/2 xl:w-2/5 overflow-y-auto'>
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
                        {isolatedListing ? (
                            <button
                                onClick={() => setSelectedPin(null)}
                                className='text-xs font-semibold text-brand-primary hover:underline'
                            >
                                ← Show all {filteredListings.length}
                            </button>
                        ) : (
                            <span className='text-xs text-gray-500'>{filteredListings.length} available</span>
                        )}
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
                            {listingsToShow.map((listing) => {
                                const pinId = listingToPin(listing).id
                                return (
                                    <ListingCard
                                        key={listing.id}
                                        listing={listing}
                                        isHighlighted={hoveredId === pinId || selectedPin?.id === pinId}
                                        onMouseEnter={() => setHoveredId(pinId)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    />
                                )
                            })}
                            {listingsToShow.length === 0 && (
                                <p className='text-sm text-gray-400 col-span-2'>No exclusive listings match your filters.</p>
                            )}
                        </div>
                    )}

                    {!isolatedListing && (
                        <button
                            onClick={() => setShowReraSection((v) => !v)}
                            className='w-full flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
                        >
                            <span>
                                {showReraSection ? 'Hide' : 'Show'} RERA-registered projects ({filteredRera.length.toLocaleString()})
                            </span>
                            <span className={`transition-transform ${showReraSection ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                    )}

                    {showReraSection && !isolatedListing && (
                        <div className='mt-4'>
                            {!isolatedProperty && (
                                <div className='flex flex-wrap items-center gap-2 mb-4'>
                                    <SimpleMultiSelect label='Type' options={typeOptions} selected={selectedTypes} onChange={setSelectedTypes} />
                                    <SimpleMultiSelect label='Status' options={statusOptions} selected={selectedStatuses} onChange={setSelectedStatuses} />
                                    <SimpleMultiSelect label='Locality' options={mandalOptions} selected={selectedMandals} onChange={setSelectedMandals} />
                                </div>
                            )}

                            {isolatedProperty && (
                                <button
                                    onClick={() => setSelectedPin(null)}
                                    className='mb-3 text-xs font-semibold text-brand-primary hover:underline'
                                >
                                    ← Show all {filteredRera.length.toLocaleString()} RERA projects
                                </button>
                            )}

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                {reraToShow.map((property) => {
                                    const pinId = propertyToPin(property).id
                                    return (
                                        <PropertyCard
                                            key={property.rera_id}
                                            property={property}
                                            isHighlighted={hoveredId === pinId || selectedPin?.id === pinId}
                                            onMouseEnter={() => setHoveredId(pinId)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        />
                                    )
                                })}
                            </div>

                            {!isolatedProperty && reraTotalPages > 1 && (
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

            <FilterChatbot locationOptions={locationOptions.map((o) => o.value)} onApply={handleChatApply} resultCount={filteredListings.length} />
        </div>
    )
}

export default Properties
