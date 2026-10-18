import { Link } from 'react-router-dom'

const NotFound = () => (
    <div className='mx-auto max-w-xl px-4 py-32 text-center'>
        <h1 className='font-display text-5xl text-gray-900 mb-4'>404</h1>
        <p className='text-gray-500 mb-8'>We couldn't find that page.</p>
        <Link to='/' className='text-brand-primary font-semibold hover:underline'>
            ← Back to home
        </Link>
    </div>
)

export default NotFound
