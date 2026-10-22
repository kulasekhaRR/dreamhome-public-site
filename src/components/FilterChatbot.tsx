import { useState } from 'react'
import { parseChatMessage, describeParsedFilters, hasAnyFilter, type ParsedChatFilters } from '../utils/chatFilterParser'

interface FilterChatbotProps {
    locationOptions: string[]
    onApply: (filters: ParsedChatFilters) => void
    resultCount: number
}

interface Message {
    role: 'user' | 'bot'
    text: string
}

const INTRO: Message = {
    role: 'bot',
    text: "Hi! Tell me what you're looking for — e.g. \"3bhk under 1.5cr in Madhurawada, ready to move\" — and I'll set the filters for you.",
}

const FilterChatbot = ({ locationOptions, onApply, resultCount }: FilterChatbotProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([INTRO])
    const [input, setInput] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const text = input.trim()
        if (!text) return

        const parsed = parseChatMessage(text, locationOptions)
        const userMsg: Message = { role: 'user', text }
        let botMsg: Message

        if (hasAnyFilter(parsed)) {
            onApply(parsed)
            botMsg = { role: 'bot', text: `Got it — showing ${describeParsedFilters(parsed)}. Check the results below ↓` }
        } else {
            botMsg = {
                role: 'bot',
                text: "I couldn't find anything specific in that. Try mentioning a BHK count, a price (e.g. \"under 1.5cr\"), a locality, or \"ready to move\".",
            }
        }

        setMessages((prev) => [...prev, userMsg, botMsg])
        setInput('')
    }

    return (
        <div className='fixed bottom-4 right-4 z-[1100]'>
            {isOpen && (
                <div className='mb-3 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden'>
                    <div className='bg-brand-primary text-white px-4 py-3 flex items-center justify-between'>
                        <span className='font-semibold text-sm'>Find your home</span>
                        <button onClick={() => setIsOpen(false)} className='text-white/80 hover:text-white'>
                            ✕
                        </button>
                    </div>

                    <div className='flex-1 max-h-80 overflow-y-auto p-3 space-y-2'>
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`text-sm rounded-xl px-3 py-2 max-w-[85%] ${
                                    m.role === 'bot'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-brand-primary text-white ml-auto'
                                }`}
                            >
                                {m.text}
                            </div>
                        ))}
                        <div className='text-xs text-gray-400 pt-1'>{resultCount} exclusive listings currently match</div>
                    </div>

                    <form onSubmit={handleSubmit} className='border-t border-gray-200 p-2 flex gap-2'>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='3bhk ready to move...'
                            className='flex-1 h-9 px-3 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary'
                        />
                        <button
                            type='submit'
                            className='h-9 px-4 rounded-full bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark'
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={() => setIsOpen((v) => !v)}
                className='h-14 w-14 rounded-full bg-brand-primary text-white shadow-lg flex items-center justify-center text-2xl hover:bg-brand-primary-dark transition-colors'
                aria-label='Open filter assistant'
            >
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    )
}

export default FilterChatbot
