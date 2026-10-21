import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    type User,
} from 'firebase/auth'
import { auth } from '../firebase'

interface AuthContextValue {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
    googleRedirectError: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const googleProvider = new GoogleAuthProvider()

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [googleRedirectError, setGoogleRedirectError] = useState<string | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    useEffect(() => {
        // Completes the sign-in after Google redirects back here. Using
        // signInWithRedirect (full-page redirect) instead of
        // signInWithPopup — Chrome's Cross-Origin-Opener-Policy breaks the
        // popup flow for many Firebase projects (the popup closes instantly
        // with no way for the SDK to read the result), a known issue with
        // no popup-side fix; redirect sidesteps it entirely.
        getRedirectResult(auth).catch((err) => {
            setGoogleRedirectError((err as { code?: string }).code || 'auth/unknown-error')
        })
    }, [])

    const value: AuthContextValue = {
        user,
        loading,
        googleRedirectError,
        signIn: async (email, password) => {
            await signInWithEmailAndPassword(auth, email, password)
        },
        signUp: async (email, password) => {
            await createUserWithEmailAndPassword(auth, email, password)
        },
        signInWithGoogle: async () => {
            await signInWithRedirect(auth, googleProvider)
        },
        signOut: () => firebaseSignOut(auth),
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
