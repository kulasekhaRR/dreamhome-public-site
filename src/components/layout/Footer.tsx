import { Link } from 'react-router-dom'
import Logo from '../Logo'

const Footer = () => {
    const year = new Date().getFullYear()

    return (
        <footer className='bg-brand-primary text-white mt-24'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10'>
                <div>
                    <Logo variant='white' />
                    <p className='mt-3 text-sm text-white/70 leading-relaxed'>
                        Verified new-construction projects, plots and ventures across Visakhapatnam district —
                        sourced directly from the official AP RERA registry.
                    </p>
                </div>

                <div>
                    <h3 className='text-sm font-semibold text-white/90 mb-3'>Explore</h3>
                    <ul className='space-y-2 text-sm text-white/70'>
                        <li><Link to='/properties' className='hover:text-white'>All Properties</Link></li>
                        <li><Link to='/map' className='hover:text-white'>Map View</Link></li>
                        <li><Link to='/about' className='hover:text-white'>About Us</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className='text-sm font-semibold text-white/90 mb-3'>Service Area</h3>
                    <ul className='space-y-2 text-sm text-white/70'>
                        <li>Visakhapatnam district</li>
                        <li>Andhra Pradesh, India</li>
                    </ul>
                </div>

                <div>
                    <h3 className='text-sm font-semibold text-white/90 mb-3'>Contact</h3>
                    <ul className='space-y-2 text-sm text-white/70'>
                        <li><Link to='/contact' className='hover:text-white'>Get in touch</Link></li>
                        <li>Visakhapatnam, Andhra Pradesh</li>
                    </ul>
                </div>
            </div>

            <div className='border-t border-white/10'>
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50'>
                    <span>© {year} DreamHome. All rights reserved.</span>
                    <span>
                        Project data from AP RERA (rera.ap.gov.in). Location imagery ©{' '}
                        <a href='https://www.openstreetmap.org/copyright' target='_blank' rel='noreferrer' className='underline hover:text-white'>
                            OpenStreetMap
                        </a>{' '}
                        contributors.
                    </span>
                </div>
            </div>
        </footer>
    )
}

export default Footer
