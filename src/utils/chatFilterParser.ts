// A lightweight, fully offline keyword/regex parser — no LLM API, so this
// costs nothing to run. It understands the handful of patterns people
// actually type when describing what they want ("3bhk under 1.5cr in
// madhurawada ready to move"), not open-ended conversation.

export interface ParsedChatFilters {
    bhk?: string
    facing?: string
    location?: string
    readyToMove?: boolean
    priceMaxLakhs?: number
    priceMinLakhs?: number
}

const FACING_WORDS: Record<string, string> = {
    north: 'N',
    south: 'S',
    east: 'E',
    west: 'W',
}

function extractPriceLakhs(text: string, verbs: string[]): number | undefined {
    const verbPattern = verbs.join('|')
    const match = text.match(
        new RegExp(`(?:${verbPattern})\\s*(?:rs\\.?|₹)?\\s*(\\d+(?:\\.\\d+)?)\\s*(cr|crore|crores|l|lac|lakh|lakhs)?`, 'i'),
    )
    if (!match) return undefined
    const value = Number(match[1])
    const unit = (match[2] || '').toLowerCase()
    if (unit.startsWith('cr')) return value * 100
    return value // lakhs (or unitless — assume lakhs, the UI's own unit)
}

export function parseChatMessage(text: string, knownLocations: string[]): ParsedChatFilters {
    const lower = text.toLowerCase()
    const result: ParsedChatFilters = {}

    const bhkMatch = lower.match(/(\d)\s*-?\s*bhk/)
    if (bhkMatch) result.bhk = bhkMatch[1]

    for (const [word, letter] of Object.entries(FACING_WORDS)) {
        if (lower.includes(`${word} facing`) || lower.includes(`facing ${word}`)) {
            result.facing = letter
            break
        }
    }

    if (/ready\s*to\s*move|\bready\b/.test(lower)) result.readyToMove = true

    const maxPrice = extractPriceLakhs(lower, ['under', 'below', 'less than', 'upto', 'up to', 'within'])
    if (maxPrice !== undefined) result.priceMaxLakhs = maxPrice
    const minPrice = extractPriceLakhs(lower, ['above', 'over', 'more than', 'min'])
    if (minPrice !== undefined) result.priceMinLakhs = minPrice

    const matchedLocation = knownLocations.find((loc) => lower.includes(loc.toLowerCase()))
    if (matchedLocation) result.location = matchedLocation

    return result
}

export function describeParsedFilters(filters: ParsedChatFilters): string {
    const parts: string[] = []
    if (filters.bhk) parts.push(`${filters.bhk} BHK`)
    if (filters.facing) parts.push(`${filters.facing}-facing`)
    if (filters.location) parts.push(`in ${filters.location}`)
    if (filters.readyToMove) parts.push('ready to move')
    if (filters.priceMinLakhs !== undefined) parts.push(`above ₹${filters.priceMinLakhs}L`)
    if (filters.priceMaxLakhs !== undefined) parts.push(`under ₹${filters.priceMaxLakhs}L`)
    return parts.join(', ')
}

export function hasAnyFilter(filters: ParsedChatFilters): boolean {
    return Object.keys(filters).length > 0
}
