const About = () => (
    <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16'>
        <h1 className='font-display text-4xl text-gray-900 mb-6'>About DreamHome</h1>
        <p className='text-gray-600 leading-relaxed'>
            DreamHome helps homebuyers across Visakhapatnam district find new-construction
            residential projects, plots and ventures with confidence. Every project listed here is cross-checked
            against the official Andhra Pradesh Real Estate Regulatory Authority (RERA) registry — the same
            registration builders are legally required to file before marketing a project.
        </p>

        <h2 className='font-display text-2xl text-gray-900 mt-10 mb-4'>Why RERA-verified data matters</h2>
        <p className='text-gray-600 leading-relaxed'>
            Real estate in India has long been plagued by unregistered projects, delayed possession and unclear
            ownership. RERA was introduced to fix exactly that — requiring every promoter to register project
            details, timelines and approvals publicly. We built DreamHome to make that public data genuinely
            usable: searchable, mapped, and easy to browse by locality.
        </p>

        <h2 className='font-display text-2xl text-gray-900 mt-10 mb-4'>What we don't do</h2>
        <ul className='list-disc pl-5 text-gray-600 space-y-2'>
            <li>We don't scrape or aggregate resale listings from other portals.</li>
            <li>We don't show prices we can't verify — pricing varies by builder and isn't part of the public registry.</li>
            <li>
                We don't show fake property photos. AP RERA's registry doesn't publish building photos, so instead of
                a stock image pretending to be the property, every listing shows a real OpenStreetMap view of its
                actual locality.
            </li>
            <li>We don't spam you — browse freely, reach out only if you want to.</li>
        </ul>

        <h2 className='font-display text-2xl text-gray-900 mt-10 mb-4'>Our coverage</h2>
        <p className='text-gray-600 leading-relaxed'>
            We cover every RERA-registered project across Visakhapatnam district — from Gajuwaka and Pendurthi near
            the city, out to Narsipatnam and Yelamanchili. Every listing shows its distance from Seethammadhara so
            you always know how far it actually is.
        </p>
    </div>
)

export default About
