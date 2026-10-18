import { useState } from 'react'

// TODO: replace with your real contact address before launch.
const CONTACT_EMAIL = 'hello@dreamhome.example'

const Contact = () => {
    const [form, setForm] = useState({ name: '', phone: '', message: '' })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const subject = encodeURIComponent(`Enquiry from ${form.name || 'website visitor'}`)
        const body = encodeURIComponent(`Name: ${form.name}\nPhone: ${form.phone}\n\n${form.message}`)
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    }

    return (
        <div className='mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16'>
            <h1 className='font-display text-4xl text-gray-900 mb-3'>Get in Touch</h1>
            <p className='text-gray-600 mb-10'>
                Have a question about a project, or want help finding the right one? Send us a message.
            </p>

            <form onSubmit={handleSubmit} className='space-y-5'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                    <input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className='w-full h-11 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Phone</label>
                    <input
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className='w-full h-11 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Message</label>
                    <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary'
                    />
                </div>
                <button
                    type='submit'
                    className='w-full h-12 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-primary-dark transition-colors'
                >
                    Send Message
                </button>
                <p className='text-xs text-gray-400 text-center'>
                    This opens your email app addressed to {CONTACT_EMAIL} — no data is sent to a server.
                </p>
            </form>
        </div>
    )
}

export default Contact
