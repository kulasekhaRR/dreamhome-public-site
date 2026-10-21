import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const FRIENDLY_ERRORS: Record<string, string> = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
}

const Login = () => {
    const navigate = useNavigate()
    const { signIn, signUp } = useAuth()
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            if (mode === 'signin') {
                await signIn(email, password)
            } else {
                await signUp(email, password)
            }
            navigate('/')
        } catch (err) {
            const code = (err as { code?: string }).code || ''
            setError(FRIENDLY_ERRORS[code] || 'Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='mx-auto max-w-md px-4 sm:px-6 py-16'>
            <h1 className='font-display text-3xl text-gray-900 mb-2'>
                {mode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className='text-gray-500 mb-8'>
                {mode === 'signin' ? 'Sign in to your DreamHome account.' : 'Sign up to get started with DreamHome.'}
            </p>

            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                    <input
                        type='email'
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full h-11 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary'
                    />
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
                    <input
                        type='password'
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='w-full h-11 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary'
                    />
                </div>

                {error && <p className='text-sm text-red-600'>{error}</p>}

                <button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full h-12 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50'
                >
                    {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
            </form>

            <p className='mt-6 text-sm text-gray-500 text-center'>
                {mode === 'signin' ? (
                    <>
                        Don't have an account?{' '}
                        <button onClick={() => setMode('signup')} className='text-brand-primary font-medium hover:underline'>
                            Sign up
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{' '}
                        <button onClick={() => setMode('signin')} className='text-brand-primary font-medium hover:underline'>
                            Sign in
                        </button>
                    </>
                )}
            </p>

            <p className='mt-4 text-xs text-gray-400 text-center'>
                <Link to='/' className='hover:underline'>
                    ← Back to browsing
                </Link>
            </p>
        </div>
    )
}

export default Login
