// A project/listing whose promised completion date has already passed
// shouldn't still read as "Under Development" / a future-sounding date —
// this derives an honest display status instead of trusting the stored
// status text blindly.

const MONTH_ALIASES: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
}

// RERA's expected_completion is always "DD/MM/YYYY" (verified against the
// full dataset — no exceptions).
export function parseReraDate(value: string): Date | null {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) return null
    const [, day, month, year] = match
    return new Date(Number(year), Number(month) - 1, Number(day))
}

// The curated listings sheet's Possession column is free text: "Dec 2026",
// "Dec2026" (no space), "Sept 2027" (non-standard abbreviation), or "Given"
// (handled separately via is_ready_to_move before this is ever called).
export function parseListingPossession(value: string): Date | null {
    const match = value.trim().match(/^([A-Za-z]+)\s*(\d{4})$/)
    if (!match) return null
    const month = MONTH_ALIASES[match[1].toLowerCase()]
    if (month === undefined) return null
    // Compare against the start of the following month — "March 2027"
    // means complete sometime during March, not on the 1st.
    return new Date(Number(match[2]), month + 1, 1)
}

export function isPast(date: Date | null): boolean {
    return date !== null && date.getTime() <= Date.now()
}
