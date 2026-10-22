import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchListings } from '../services/listingsService'
import type { Listing } from '../types/listing'
import PropertyMap from '../components/PropertyMap'
import { toTitleCase, formatIndianPrice } from '../utils/format'
import { assetPath } from '../utils/assetPath'
import { listingToPin } from '../utils/mapPins'
import { parseListingPossession, isPast } from '../utils/completion'

const ListingDetail = () => {
    const { id } = useParams<{ id: string }>()
    const [listing, setListing] = useState<Listing | null | undefined>(undefined)
    const [showMap, setShowMap] = useState(true)

    useEffect(() => {
        fetchListings()
            .then((data) => {
                const match = data.listings.find((l) => l.id === id)
                setListing(match ?? null)
            })
            .catch(() => setListing(null))
    }, [id])

    if (listing === undefined) {
        return <div className='mx-auto max-w-5xl px-4 py-24 text-center text-gray-400'>Loading…</div>
    }

    if (listing === null) {
        return (
            <div className='mx-auto max-w-5xl px-4 py-24 text-center'>
                <h1 className='font-display text-2xl text-gray-900 mb-3'>Listing not found</h1>
                <Link to='/properties' className='text-brand-primary font-medium hover:underline'>
                    ← Back to all properties
                </Link>
            </div>
        )
    }

    // The sheet's promised possession month can pass without the row ever
    // being updated to "Given" — if that date is behind us, it should read
    // as ready to move rather than a now-meaningless future-sounding date.
    const effectivelyReady = listing.is_ready_to_move || isPast(parseListingPossession(listing.possession))

    return (
        <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12'>
            <Link to='/properties' className='text-sm font-medium text-gray-500 hover:text-brand-primary'>
                ← Back to all properties
            </Link>

            {listing.location_image && (
                <div className='mt-4 relative rounded-2xl overflow-hidden h-48 sm:h-64'>
                    <img
                        src={assetPath(listing.location_image)}
                        alt={`Map of ${listing.location}`}
                        className='absolute inset-0 w-full h-full object-cover'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                    <span className='absolute bottom-2 right-3 text-[10px] text-white/80'>
                        Map imagery © OpenStreetMap contributors — shown for location context, not a photo of the property
                    </span>
                </div>
            )}

            <div className='mt-4 flex flex-wrap items-start justify-between gap-4'>
                <div>
                    <h1 className='font-display text-3xl text-gray-900'>{toTitleCase(listing.project_name)}</h1>
                    <p className='text-gray-500 mt-2'>{listing.location}</p>
                </div>
                <div className='flex flex-col items-end gap-2'>
                    {listing.is_exclusive && (
                        <span className='text-xs font-bold px-3 py-1.5 rounded-full bg-brand-accent text-brand-primary uppercase tracking-wide'>
                            Exclusive Listing
                        </span>
                    )}
                    <span
                        className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                            effectivelyReady ? 'bg-brand-emerald-light text-brand-emerald' : 'bg-brand-accent-light text-brand-primary'
                        }`}
                    >
                        {effectivelyReady ? 'Ready to move' : `Possession: ${listing.possession}`}
                    </span>
                </div>
            </div>

            <div className='mt-6 rounded-2xl bg-brand-cream p-6 flex items-baseline justify-between flex-wrap gap-2'>
                <div>
                    <div className='text-xs text-gray-500'>Estimated Price</div>
                    <div className='font-display text-3xl text-brand-primary mt-1'>
                        {formatIndianPrice(listing.total_price_estimate)}
                    </div>
                </div>
                <div className='text-right'>
                    {listing.price_per_sqft && (
                        <div className='text-sm text-gray-600'>₹{listing.price_per_sqft.toLocaleString()} / sqft</div>
                    )}
                    {listing.amenities_value_lakhs ? (
                        <div className='text-xs text-gray-400 mt-0.5'>
                            Includes ₹{listing.amenities_value_lakhs} L amenities charge
                        </div>
                    ) : null}
                </div>
            </div>

            <div className='mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4'>
                {[
                    ['BHK', listing.bhk],
                    ['Area', listing.area_sqft ? `${listing.area_sqft.toLocaleString()} sqft` : '—'],
                    ['Facing', listing.facing || '—'],
                    [
                        'Amenities Charge',
                        listing.amenities_value_lakhs ? `₹${listing.amenities_value_lakhs} L` : 'Included',
                    ],
                ].map(([label, value]) => (
                    <div key={label} className='rounded-xl border border-gray-200 p-4'>
                        <div className='text-xs text-gray-500'>{label}</div>
                        <div className='mt-1 font-semibold text-gray-900 text-sm'>{value || '—'}</div>
                    </div>
                ))}
            </div>

            {listing.description && (
                <div className='mt-8'>
                    <h2 className='font-display text-xl text-gray-900 mb-2'>Notes</h2>
                    <p className='text-sm text-gray-600 leading-relaxed'>{listing.description}</p>
                </div>
            )}

            <div className='mt-10'>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='font-display text-xl text-gray-900'>Location</h2>
                    <button
                        onClick={() => setShowMap((v) => !v)}
                        className='text-sm font-medium text-brand-primary hover:underline'
                    >
                        {showMap ? 'Hide map' : 'Show map'}
                    </button>
                </div>
                {showMap && (
                    <>
                        <div className='rounded-2xl overflow-hidden border border-gray-200 h-96'>
                            <PropertyMap pins={[listingToPin(listing)]} center={[listing.lat, listing.lon]} zoom={12} />
                        </div>
                        {listing.geocode_source === 'vizag_fallback' && (
                            <p className='text-xs text-gray-400 mt-2'>
                                Exact locality coordinates weren't available for this listing — map is centred on
                                Visakhapatnam city.
                            </p>
                        )}
                    </>
                )}
            </div>

            <div className='mt-10 rounded-2xl bg-brand-cream p-6'>
                <h2 className='font-display text-lg text-gray-900 mb-2'>About this listing</h2>
                <p className='text-sm text-gray-600 leading-relaxed'>
                    This is a curated listing from DreamHome's partner network, not part of the public AP RERA
                    registry. Contact us for current availability, site visits and final pricing.
                </p>
            </div>
        </div>
    )
}

export default ListingDetail
