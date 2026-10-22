import { useDropdown } from '../hooks/useDropdown'

interface Option {
    label: string
    value: string
}

interface SimpleMultiSelectProps {
    label: string
    options: Option[]
    selected: string[]
    onChange: (values: string[]) => void
}

const SimpleMultiSelect = ({ label, options, selected, onChange }: SimpleMultiSelectProps) => {
    const { open, align, ref, toggle } = useDropdown<HTMLDivElement>()

    const toggleValue = (value: string) => {
        onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
    }

    return (
        <div className='relative' ref={ref}>
            <button
                onClick={toggle}
                className={`h-10 px-4 rounded-full border text-sm font-medium flex items-center gap-2 transition-colors ${
                    selected.length > 0
                        ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
            >
                {label}
                {selected.length > 0 && (
                    <span className='bg-brand-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                        {selected.length}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className={`absolute z-30 mt-2 w-60 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-2 ${
                        align === 'right' ? 'right-0' : 'left-0'
                    }`}
                >
                    {options.length === 0 && <div className='px-4 py-2 text-sm text-gray-400'>No options</div>}
                    {options.map((option) => (
                        <label
                            key={option.value}
                            className='flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer'
                        >
                            <input
                                type='checkbox'
                                checked={selected.includes(option.value)}
                                onChange={() => toggleValue(option.value)}
                                className='rounded border-gray-300 text-brand-primary focus:ring-brand-primary'
                            />
                            {option.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SimpleMultiSelect
