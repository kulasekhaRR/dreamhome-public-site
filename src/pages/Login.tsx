import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { auth } from '../firebase'

const FRIENDLY_ERRORS: Record<string, string> = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email, password, or code.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-phone-number': "That phone number doesn't look right — include the country code, e.g. +91.",
    'auth/too-many-requests': 'Too many attempts. Please wait a bit and try again.',
    'auth/code-expired': 'That code expired — request a new one.',
}

const friendlyError = (err: unknown) => {
    const code = (err as { code?: string }).code || ''
    return FRIENDLY_ERRORS[code] || 'Something went wrong. Please try again.'
}

const Login = () => {
    const navigate = useNavigate()
    const { signIn, signUp } = useAuth()
    const [method, setMethod] = useState<'email' | 'phone'>('email')
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Email/password
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Phone OTP
    const [phone, setPhone] = useState('+91')
    const [otp, setOtp] = useState('')
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
    const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

    useEffect(() => {
        // Invisible reCAPTCHA, created once and reused for this page's lifetime.
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
        return () => {
            recaptchaRef.current?.clear()
            recaptchaRef.current = null
        }
    }, [])

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            if (mode === 'signin') await signIn(email, password)
            else await signUp(email, password)
            navigate('/')
        } catch (err) {
            setError(friendlyError(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            if (!recaptchaRef.current) throw new Error('reCAPTCHA not ready')
            const result = await signInWithPhoneNumber(auth, phone, recaptchaRef.current)
            setConfirmationResult(result)
        } catch (err) {
            setError(friendlyError(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            if (!confirmationResult) throw new Error('No OTP request in progress')
            await confirmationResult.confirm(otp)
            navigate('/')
        } catch (err) {
            setError(friendlyError(err))
        } finally {
            setIsSubmitting(false)
        }
    }

    const switchMethod = (next: 'email' | 'phone') => {
        setMethod(next)
        setError('')
        setConfirmationResult(null)
        setOtp('')
    }

    return (
        <div className='mx-auto max-w-md px-4 sm:px-6 py-16'>
            <h1 className='font-display text-3xl text-gray-900 mb-2'>
                {method === 'email' && mode === 'signup' ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className='text-gray-500 mb-6'>Sign in to your DreamHome account.</p>

            <div className='flex rounded-full bg-gray-100 p-1 mb-6'>
                <button
                    onClick={() => switchMethod('email')}
                    className={`flex-1 h-9 rounded-full text-sm font-medium transition-colors ${
                        method === 'email' ? 'bg-white shadow text-brand-primary' : 'text-gray-500'
                    }`}
                >
                    Email
                </button>
                <button
                    onClick={() => switchMethod('phone')}
                    className={`flex-1 h-9 rounded-full text-sm font-medium transition-colors ${
                        method === 'phone' ? 'bg-white shadow text-brand-primary' : 'text-gray-500'
                    }`}
                >
                    Phone OTP
                </button>
            </div>

            {method === 'email' && (
                <form onSubmit={handleEmailSubmit} className='space-y-4'>
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

                    <p className='text-sm text-gray-500 text-center'>
                        {mode === 'signin' ? (
                            <>
                                Don't have an account?{' '}
                                <button type='button' onClick={() => setMode('signup')} className='text-brand-primary font-medium hover:underline'>
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button type='button' onClick={() => setMode('signin')} className='text-brand-primary font-medium hover:underline'>
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </form>
            )}

            {method === 'phone' && !confirmationResult && (
                <form onSubmit={handleSendOtp} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Phone number</label>
                        <input
                            type='tel'
                            required
                            placeholder='+91 98765 43210'
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className='w-full h-11 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary'
                        />
                        <p className='mt-1 text-xs text-gray-400'>Include the country code (e.g. +91 for India).</p>
                    </div>

                    {error && <p className='text-sm text-red-600'>{error}</p>}

                    <button
                        type='submit'
                        disabled={isSubmitting}
                        className='w-full h-12 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50'
                    >
                        {isSubmitting ? 'Sending…' : 'Send OTP'}
                    </button>
                </form>
            )}

            {method === 'phone' && confirmationResult && (
                <form onSubmit={handleVerifyOtp} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Enter the OTP sent to {phone}</label>
                        <input
                            type='text'
                            inputMode='numeric'
                            required
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className='w-full h-11 px-4 rounded-lg border border-gray-300 tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-brand-primary'
                        />
                    </div>

                    {error && <p className='text-sm text-red-600'>{error}</p>}

                    <button
                        type='submit'
                        disabled={isSubmitting}
                        className='w-full h-12 rounded-full bg-brand-primary text-white font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-50'
                    >
                        {isSubmitting ? 'Verifying…' : 'Verify & Sign In'}
                    </button>

                    <button
                        type='button'
                        onClick={() => {
                            setConfirmationResult(null)
                            setOtp('')
                        }}
                        className='w-full text-sm text-gray-500 hover:underline'
                    >
                        ← Use a different number
                    </button>
                </form>
            )}

            {/* Required mount point for Firebase's invisible reCAPTCHA. */}
            <div id='recaptcha-container' />

            <p className='mt-4 text-xs text-gray-400 text-center'>
                <Link to='/' className='hover:underline'>
                    ← Back to browsing
                </Link>
            </p>
        </div>
    )
}

export default Login
