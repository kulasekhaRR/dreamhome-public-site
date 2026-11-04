import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// A Firebase web config is not a secret — it's meant to be embedded in
// client-side code. Security is enforced by Firestore/Auth rules and
// authorized domains, not by hiding this object. See firestore.rules.
// Hosting sites in this project that can serve their own /__/auth/handler
// and /__/firebase/init.json (both deployed as real Hosting targets — see
// firebase.json). When the app is running on one of these, use ITS OWN
// hostname as authDomain so signInWithRedirect completes same-origin, with
// no cross-domain iframe relay to a different authDomain — that relay is
// what broke Google Sign-In on dreamhouse-vizag.web.app (depends on
// cross-site storage access that Chrome's storage partitioning can silently
// block). Any other host (GitHub Pages, localhost, a future custom domain)
// falls back to the default project authDomain.
const SELF_SERVED_AUTH_DOMAINS = ['dreamhouse-vizag.web.app', 'dreamhomes-9bfa3.web.app', 'dreamhomes-9bfa3.firebaseapp.com']

const authDomain =
    typeof window !== 'undefined' && SELF_SERVED_AUTH_DOMAINS.includes(window.location.hostname)
        ? window.location.hostname
        : 'dreamhomes-9bfa3.firebaseapp.com'

const firebaseConfig = {
    projectId: 'dreamhomes-9bfa3',
    appId: '1:1086324151008:web:b125b4e1d0741f62027685',
    storageBucket: 'dreamhomes-9bfa3.firebasestorage.app',
    apiKey: 'AIzaSyCMgpIMVd_2aKBx9fTp4D6_E1icSkxvRws',
    authDomain,
    messagingSenderId: '1086324151008',
    measurementId: 'G-TPLL7ZXW22',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Debug-only: point at the local Auth emulator to isolate whether a
// sign-in bug is in our code or in the live Google/Firebase interaction.
if (import.meta.env.VITE_USE_AUTH_EMULATOR === '1') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
}
