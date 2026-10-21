export function toTitleCase(value: string): string {
    if (!value) return value
    return value
        .toLowerCase()
        .split(/\s+/)
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
        .join(' ')
}

// Indian numbering convention (lakh/crore), standard for real estate pricing.
export function formatIndianPrice(rupees: number | null | undefined): string {
    if (!rupees) return 'Price on request'
    if (rupees >= 1e7) return `₹${(rupees / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`
    if (rupees >= 1e5) return `₹${(rupees / 1e5).toFixed(2).replace(/\.?0+$/, '')} L`
    return `₹${rupees.toLocaleString('en-IN')}`
}

export function timeAgo(isoDate: string): string {
    const then = new Date(isoDate).getTime()
    if (Number.isNaN(then)) return ''
    const seconds = Math.floor((Date.now() - then) / 1000)

    const units: [number, string][] = [
        [60, 'second'],
        [60, 'minute'],
        [24, 'hour'],
        [7, 'day'],
        [4.345, 'week'],
        [12, 'month'],
        [Number.POSITIVE_INFINITY, 'year'],
    ]

    let value = seconds
    for (const [divisor, unit] of units) {
        if (value < divisor) {
            const rounded = Math.floor(value)
            return `${rounded} ${unit}${rounded !== 1 ? 's' : ''} ago`
        }
        value /= divisor
    }
    return ''
}
