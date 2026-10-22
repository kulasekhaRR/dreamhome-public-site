import { Link } from 'react-router-dom'
import type { Property } from '../types/property'
import { toTitleCase } from '../utils/format'
import { assetPath } from '../utils/assetPath'
import { parseReraDate, isPast } from '../utils/completion'

const statusStyles: Record<string, string> = {
    'New Project': 'bg-brand-emerald-light text-brand-emerald',
    'Under Development': 'bg-brand-accent-light text-brand-primary',
    Completed: 'bg-gray-100 text-gray-600',
}

interface PropertyCardProps {
    property: Property
    isHighlighted?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

const PropertyCard = ({ property, isHighlighted, onMouseEnter, onMouseLeave }: PropertyCardProps) => {
    // The bulk RERA directory only ever has "New Project" / "Under
    // Development" as a stored status, even once the promised completion
    // date has clearly passed — a past-dated project reads oddly as still
    // "Under Development", so derive a more honest label for display.
    const displayStatus = isPast(parseReraDate(property.expected_completion)) ? 'Completed' : property.status
    const statusClass = statusStyles[displayStatus] || 'bg-gray-100 text-gray-700'

    return (
        <Link
            to={`/properties/${property.rera_id.toLowerCase()}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`group block rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${
                isHighlighted
                    ? 'border-brand-primary shadow-lg -translate-y-0.5 ring-2 ring-brand-primary/30'
                    : 'border-gray-200 hover:shadow-lg hover:-translate-y-0.5'
            }`}
        >
            <div className='relative h-28 bg-gradient-to-br from-brand-primary to-brand-primary-dark overflow-hidden'>
                {property.mandal_image && (
                    <img
                        src={assetPath(property.mandal_image)}
                        alt={`Map of ${property.mandal}`}
                        className='absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300'
                        loading='lazy'
                    />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-brand-primary-dark/80 via-brand-primary-dark/10 to-transparent' />
                <span className='absolute bottom-2 left-3 text-xs font-semibold text-white/90 uppercase tracking-wide'>
                    {toTitleCase(property.project_type)}
                </span>
            </div>
            <div className='p-4'>
                <div className='flex items-start justify-between gap-2'>
                    <h3 className='font-semibold text-gray-900 line-clamp-2' title={property.project_name}>
                        {toTitleCase(property.project_name)}
                    </h3>
                    <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}>
                        {displayStatus}
                    </span>
                </div>
                <p className='mt-2 text-sm text-gray-500 line-clamp-1'>{property.place}</p>
                {/* RERA ID moved to the detail page only — it's a trust/
                    verification detail nobody actually checks at a glance
                    on the card. */}
                <div className='mt-3 text-xs text-gray-500'>~{property.distance_km_from_target_mandal_level} km away</div>
            </div>
        </Link>
    )
}

export default PropertyCard
