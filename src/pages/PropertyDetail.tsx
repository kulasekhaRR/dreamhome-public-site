import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProperties } from '../services/propertiesService'
import type { Property } from '../types/property'
import PropertyMap from '../components/PropertyMap'
import { toTitleCase } from '../utils/format'
import { assetPath } from '../utils/assetPath'

const PropertyDetail = () => {
    const { id } = useParams<{ id: string }>()
    const [property, setProperty] = useState<Property | null | undefined>(undefined)

    useEffect(() => {
        fetchProperties()
            .then((data) => {
                const match = data.projects.find((p) => p.rera_id.toLowerCase() === id?.toLowerCase())
                setProperty(match ?? null)
            })
            .catch(() => setProperty(null))
    }, [id])

    if (property === undefined) {
        return <div className='mx-auto max-w-5xl px-4 py-24 text-center text-gray-400'>Loading…</div>
    }

    if (property === null) {
        return (
            <div className='mx-auto max-w-5xl px-4 py-24 text-center'>
                <h1 className='font-display text-2xl text-gray-900 mb-3'>Property not found</h1>
                <Link to='/properties' className='text-brand-primary font-medium hover:underline'>
                    ← Back to all properties
                </Link>
            </div>
        )
    }

    return (
        <div className='mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12'>
            <Link to='/properties' className='text-sm font-medium text-gray-500 hover:text-brand-primary'>
                ← Back to all properties
            </Link>

            {property.mandal_image && (
                <div className='mt-4 relative rounded-2xl overflow-hidden h-48 sm:h-64'>
                    <img
                        src={assetPath(property.mandal_image)}
                        alt={`Map of ${property.mandal}`}
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
                    <h1 className='font-display text-3xl text-gray-900'>{toTitleCase(property.project_name)}</h1>
                    <p className='text-gray-500 mt-2'>{property.place}</p>
                </div>
                <span
                    className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                        property.status === 'Under Development' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                >
                    {property.status}
                </span>
            </div>

            <div className='mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4'>
                {[
                    ['RERA ID', property.rera_id],
                    ['Project Type', property.project_type],
                    ['Approved', property.approval_date],
                    ['Expected Completion', property.expected_completion],
                ].map(([label, value]) => (
                    <div key={label} className='rounded-xl border border-gray-200 p-4'>
                        <div className='text-xs text-gray-500'>{label}</div>
                        <div className='mt-1 font-semibold text-gray-900 text-sm'>{value || '—'}</div>
                    </div>
                ))}
            </div>

            <div className='mt-10'>
                <h2 className='font-display text-xl text-gray-900 mb-4'>Location</h2>
                <div className='rounded-2xl overflow-hidden border border-gray-200 h-96'>
                    <PropertyMap
                        properties={[property]}
                        center={[property.mandal_lat, property.mandal_lon]}
                        zoom={13}
                    />
                </div>
                <p className='text-xs text-gray-400 mt-2'>
                    Location shown is approximate (mandal-level), not the exact plot boundary.
                </p>
            </div>

            <div className='mt-10 rounded-2xl bg-brand-cream p-6'>
                <h2 className='font-display text-lg text-gray-900 mb-2'>About this data</h2>
                <p className='text-sm text-gray-600 leading-relaxed'>
                    This project is registered with the Andhra Pradesh Real Estate Regulatory Authority (RERA) under ID{' '}
                    <strong>{property.rera_id}</strong>. DreamHome sources this information directly from the public{' '}
                    <a href='https://rera.ap.gov.in' target='_blank' rel='noreferrer' className='text-brand-primary underline'>
                        AP RERA registry
                    </a>
                    . Pricing, floor plans and builder contact details are not part of the public registry — reach out
                    to us for current availability and pricing on this project.
                </p>
            </div>
        </div>
    )
}

export default PropertyDetail
