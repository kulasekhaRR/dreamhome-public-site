interface LogoProps {
    variant?: 'color' | 'white'
    className?: string
}

// House-mark + wordmark. The icon uses currentColor so `variant` just swaps
// the wrapping text color class — purple on light backgrounds (navbar),
// white on the dark footer.
const Logo = ({ variant = 'color', className = '' }: LogoProps) => {
    const textColorClass = variant === 'white' ? 'text-white' : 'text-brand-primary'

    return (
        <span className={`inline-flex items-center gap-2 ${textColorClass} ${className}`}>
            <svg width='28' height='28' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <polygon points='16,3 29,14 24,14 24,27 8,27 8,14 3,14' fill='currentColor' />
                <rect x='13' y='18' width='6' height='9' fill={variant === 'white' ? '#6d28d9' : '#ffffff'} />
                <circle cx='23' cy='9' r='3' fill='#ffc72c' />
            </svg>
            <span className='font-display text-2xl leading-none'>DreamHome</span>
        </span>
    )
}

export default Logo
