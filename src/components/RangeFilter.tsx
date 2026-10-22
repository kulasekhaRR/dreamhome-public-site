import { useDropdown } from '../hooks/useDropdown'

interface RangeFilterProps {
    label: string
    min: number | ''
    max: number | ''
    onChange: (min: number | '', max: number | '') => void
    unit?: string
    step?: number
}

const RangeFilter = ({ label, min, max, onChange, unit = '', step = 1 }: RangeFilterProps) => {
    const { open, align, ref, toggle } = useDropdown<HTMLDivElement>()
    const active = min !== '' || max !== ''

    return (
        <div className='relative' ref={ref}>
            <button
                onClick={toggle}
                className={`h-10 px-4 rounded-full border text-sm font-medium transition-colors ${
                    active ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
            >
                {label}
                {active && ` (${min || '0'}–${max || '∞'}${unit})`}
            </button>

            {open && (
                <div
                    className={`absolute z-30 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg p-4 ${
                        align === 'right' ? 'right-0' : 'left-0'
                    }`}
                >
                    <div className='flex items-center gap-2'>
                        <input
                            type='number'
                            step={step}
                            placeholder='Min'
                            value={min}
                            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value), max)}
                            className='w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
                        />
                        <span className='text-gray-400'>–</span>
                        <input
                            type='number'
                            step={step}
                            placeholder='Max'
                            value={max}
                            onChange={(e) => onChange(min, e.target.value === '' ? '' : Number(e.target.value))}
                            className='w-full h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
                        />
                    </div>
                    {active && (
                        <button onClick={() => onChange('', '')} className='mt-3 text-xs text-red-600 hover:underline'>
                            Clear
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default RangeFilter
