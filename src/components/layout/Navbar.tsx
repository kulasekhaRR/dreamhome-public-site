import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Logo from '../Logo'

const NAV_LINKS = [
    { to: '/properties', label: 'Properties' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
]

const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-brand-primary' : 'text-gray-600 hover:text-brand-primary'}`

const Navbar = () => {
    const [open, setOpen] = useState(false)

    return (
        <header className='sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between'>
                <NavLink to='/'>
                    <Logo />
                </NavLink>

                <nav className='hidden md:flex items-center gap-8'>
                    {NAV_LINKS.map((link) => (
                        <NavLink key={link.to} to={link.to} className={linkClasses}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <NavLink
                    to='/properties'
                    className='hidden md:inline-flex items-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark transition-colors'
                >
                    Browse Properties
                </NavLink>

                <button
                    onClick={() => setOpen((v) => !v)}
                    className='md:hidden p-2 text-gray-700'
                    aria-label='Toggle menu'
                >
                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                        {open ? <path d='M6 6l12 12M18 6L6 18' /> : <path d='M4 7h16M4 12h16M4 17h16' />}
                    </svg>
                </button>
            </div>

            {open && (
                <nav className='md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-3'>
                    {NAV_LINKS.map((link) => (
                        <NavLink key={link.to} to={link.to} className={linkClasses} onClick={() => setOpen(false)}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            )}
        </header>
    )
}

export default Navbar
