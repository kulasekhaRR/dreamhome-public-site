import { useEffect, useRef, useState } from 'react'

const POPUP_WIDTH_PX = 240 // matches the w-60 used by both dropdown popups
const VIEWPORT_MARGIN_PX = 16

/**
 * Shared open/close + click-outside + overflow-aware alignment for the
 * filter dropdowns (SimpleMultiSelect, RangeFilter). Anchoring every popup
 * to the left of its trigger overflows the viewport when the trigger sits
 * near the right edge (reported: the Price filter, usually 4th/5th in a
 * wrapped row) — this measures the trigger's position on open and flips to
 * right-anchored when a left-anchored popup would run off-screen.
 */
export function useDropdown<T extends HTMLElement = HTMLDivElement>() {
    const [open, setOpen] = useState(false)
    const [align, setAlign] = useState<'left' | 'right'>('left')
    const ref = useRef<T>(null)

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const toggle = () => {
        setOpen((wasOpen) => {
            const next = !wasOpen
            if (next && ref.current) {
                const rect = ref.current.getBoundingClientRect()
                const overflowsRight = rect.left + POPUP_WIDTH_PX > window.innerWidth - VIEWPORT_MARGIN_PX
                setAlign(overflowsRight ? 'right' : 'left')
            }
            return next
        })
    }

    return { open, setOpen, align, ref, toggle }
}
