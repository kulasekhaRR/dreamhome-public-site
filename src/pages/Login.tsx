import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const FRIENDLY_ERRORS: Record<string, string> = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/unauthorized-domain': 'This domain is not yet authorized for Google sign-in. Please contact the site owner.',
}

const Login = () => {
    const navigate = useNavigate()
    const { user, signIn, signUp, signInWithGoogle, googleRedirectError } = useAuth()
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

    // Google uses a full-page redirect (not a popup — see AuthContext), so
    // sign-in completes on the page load after Google sends the user back
    // here, not inside handleGoogleSignIn itself.
    useEffect(() => {
        if (user) navigate('/')
    }, [user, navigate])

    useEffect(() => {
        if (googleRedirectError && googleRedirectError !== 'auth/popup-closed-by-user') {
            setError(FRIENDLY_ERRORS[googleRedirectError] || 'Google sign-in failed. Please try again.')
        }
    }, [googleRedirectError])

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

    const handleGoogleSignIn = async () => {
        setError('')
        setIsGoogleSubmitting(true)
        try {
            // On success this navigates the whole page away to Google, so
            // nothing after the await runs — completion happens on the page
            // load after Google redirects back (handled by the effects
            // above). If signInWithRedirect itself throws before navigating
            // (e.g. a config error), we still need to recover here instead
            // of leaving the button stuck on "Please wait…" forever.
            await signInWithGoogle()
        } catch (err) {
            const code = (err as { code?: string }).code || ''
            setError(FRIENDLY_ERRORS[code] || 'Google sign-in failed. Please try again.')
            setIsGoogleSubmitting(false)
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

            <button
                type='button'
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting}
                className='w-full h-12 flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 mb-6'
            >
                <svg width='20' height='20' viewBox='0 0 48 48'>
                    <path fill='#FFC107' d='M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z' />
                    <path fill='#FF3D00' d='M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z' />
                    <path fill='#4CAF50' d='M24 44c5.4 0 10.3-1.8 14-5.3l-6.5-5.5C29.4 34.9 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z' />
                    <path fill='#1976D2' d='M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.5 5.8l6.5 5.5C40.5 36.5 44 31 44 24c0-1.3-.1-2.7-.4-3.5z' />
                </svg>
                {isGoogleSubmitting ? 'Please wait…' : 'Continue with Google'}
            </button>

            <div className='flex items-center gap-3 mb-6'>
                <div className='flex-1 h-px bg-gray-200' />
                <span className='text-xs text-gray-400'>or</span>
                <div className='flex-1 h-px bg-gray-200' />
            </div>

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
