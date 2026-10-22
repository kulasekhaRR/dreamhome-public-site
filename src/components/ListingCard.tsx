import { Link } from 'react-router-dom'
import type { Listing } from '../types/listing'
import { toTitleCase, formatIndianPrice } from '../utils/format'
import { assetPath } from '../utils/assetPath'
import { parseListingPossession, isPast } from '../utils/completion'

interface ListingCardProps {
    listing: Listing
    isHighlighted?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

const ListingCard = ({ listing, isHighlighted, onMouseEnter, onMouseLeave }: ListingCardProps) => {
    const effectivelyReady = listing.is_ready_to_move || isPast(parseListingPossession(listing.possession))

    return (
        <Link
            to={`/listings/${listing.id}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`group block rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${
                isHighlighted
                    ? 'border-brand-primary shadow-lg -translate-y-0.5 ring-2 ring-brand-primary/30'
                    : 'border-gray-200 hover:shadow-lg hover:-translate-y-0.5'
            }`}
        >
            <div className='relative h-28 bg-gradient-to-br from-brand-accent to-brand-accent-light overflow-hidden'>
                {listing.location_image && (
                    <img
                        src={assetPath(listing.location_image)}
                        alt={`Map of ${listing.location}`}
                        className='absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300'
                        loading='lazy'
                    />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-brand-primary-dark/80 via-brand-primary-dark/10 to-transparent' />
                <span className='absolute bottom-2 left-3 text-xs font-semibold text-white/90 uppercase tracking-wide'>
                    {listing.bhk} BHK
                </span>
                {listing.is_exclusive && (
                    <span className='absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full bg-brand-accent text-brand-primary uppercase tracking-wide'>
                        Exclusive
                    </span>
                )}
            </div>
            <div className='p-4'>
                <h3 className='font-semibold text-gray-900 line-clamp-1' title={listing.project_name}>
                    {toTitleCase(listing.project_name)}
                </h3>
                <p className='mt-1 text-sm text-gray-500 line-clamp-1'>{listing.location}</p>

                <div className='mt-3 flex items-center justify-between'>
                    <span className='text-sm font-semibold text-brand-primary'>
                        {formatIndianPrice(listing.total_price_estimate)}
                    </span>
                    <span className='text-xs text-gray-500'>{listing.area_sqft?.toLocaleString()} sqft</span>
                </div>

                <div className='mt-2 flex items-center justify-between text-xs text-gray-500'>
                    <span>{effectivelyReady ? 'Ready to move' : listing.possession}</span>
                    {listing.price_per_sqft && <span>₹{listing.price_per_sqft.toLocaleString()}/sqft</span>}
                </div>
            </div>
        </Link>
    )
}

export default ListingCard
