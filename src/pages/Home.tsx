import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProperties } from '../services/propertiesService'
import type { PropertiesDataset } from '../types/property'
import PropertyCard from '../components/PropertyCard'

const Home = () => {
    const navigate = useNavigate()
    const [data, setData] = useState<PropertiesDataset | null>(null)
    const [query, setQuery] = useState('')

    useEffect(() => {
        fetchProperties().then(setData).catch(console.error)
    }, [])

    const featured = useMemo(() => data?.projects.slice(0, 6) ?? [], [data])
    const mandalCount = useMemo(
        () => new Set(data?.projects.map((p) => p.mandal) ?? []).size,
        [data],
    )

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        navigate(query.trim() ? `/properties?q=${encodeURIComponent(query.trim())}` : '/properties')
    }

    return (
        <div>
            {/* Hero */}
            <section className='relative bg-brand-primary overflow-hidden'>
                <div className='absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#ffc72c,transparent_40%),radial-gradient(circle_at_80%_60%,#ffc72c,transparent_35%)]' />
                <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center'>
                    <p className='text-brand-accent-light text-sm font-semibold tracking-wide uppercase mb-4'>
                        Verified via Official AP RERA Registry
                    </p>
                    <h1 className='font-display text-4xl sm:text-6xl text-white leading-tight'>
                        Find your next home near Seethammadhara
                    </h1>
                    <p className='mt-6 text-lg text-white/70 max-w-2xl mx-auto'>
                        {data ? data.totalCount.toLocaleString() : '…'} RERA-registered residential projects, plots and
                        ventures across {data?.targetDistrict ?? 'Visakhapatnam'} district — every listing traceable to
                        its official government registration.
                    </p>

                    <form onSubmit={handleSearch} className='mt-10 max-w-xl mx-auto flex gap-2'>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='Search by project name or locality (e.g. Gajuwaka)'
                            className='flex-1 h-12 rounded-full px-5 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent'
                        />
                        <button
                            type='submit'
                            className='h-12 px-6 rounded-full bg-brand-accent text-brand-primary font-semibold hover:bg-brand-accent-light transition-colors'
                        >
                            Search
                        </button>
                    </form>

                    <div className='mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto text-white'>
                        <div>
                            <div className='font-display text-3xl'>{data?.totalCount.toLocaleString() ?? '—'}</div>
                            <div className='text-xs text-white/60 mt-1'>Verified Projects</div>
                        </div>
                        <div>
                            <div className='font-display text-3xl'>{mandalCount || '—'}</div>
                            <div className='text-xs text-white/60 mt-1'>Localities Covered</div>
                        </div>
                        <div>
                            <div className='font-display text-3xl'>{data?.targetDistrict ?? '—'}</div>
                            <div className='text-xs text-white/60 mt-1'>District Coverage</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured */}
            <section className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20'>
                <div className='flex items-end justify-between mb-8'>
                    <div>
                        <h2 className='font-display text-3xl text-gray-900'>Closest to Seethammadhara</h2>
                        <p className='text-gray-500 mt-2'>A sample of projects nearest to the heart of the city</p>
                    </div>
                    <Link to='/properties' className='text-sm font-semibold text-brand-primary hover:underline'>
                        View all →
                    </Link>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {featured.map((property) => (
                        <PropertyCard key={property.rera_id} property={property} />
                    ))}
                    {!data && Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className='h-56 rounded-2xl bg-gray-100 animate-pulse' />
                    ))}
                </div>
            </section>

            {/* Trust section */}
            <section className='bg-brand-cream'>
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 md:grid-cols-3 gap-10'>
                    <div>
                        <h3 className='font-display text-xl text-gray-900 mb-2'>Government-verified data</h3>
                        <p className='text-sm text-gray-600 leading-relaxed'>
                            Every project on DreamHome is sourced directly from the Andhra Pradesh Real Estate
                            Regulatory Authority (RERA) — the same registry builders are legally required to register
                            with.
                        </p>
                    </div>
                    <div>
                        <h3 className='font-display text-xl text-gray-900 mb-2'>Explore on the map</h3>
                        <p className='text-sm text-gray-600 leading-relaxed'>
                            See exactly where projects sit relative to Seethammadhara with our interactive map —
                            clustered for clarity, zoomable down to each locality.
                        </p>
                    </div>
                    <div>
                        <h3 className='font-display text-xl text-gray-900 mb-2'>No noise, no spam listings</h3>
                        <p className='text-sm text-gray-600 leading-relaxed'>
                            No scraped resale ads or duplicate listings — just officially registered new-construction
                            projects, plots and ventures.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
