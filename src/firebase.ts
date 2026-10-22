import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// A Firebase web config is not a secret — it's meant to be embedded in
// client-side code. Security is enforced by Firestore/Auth rules and
// authorized domains, not by hiding this object. See firestore.rules.
const firebaseConfig = {
    projectId: 'dreamhomes-9bfa3',
    appId: '1:1086324151008:web:b125b4e1d0741f62027685',
    storageBucket: 'dreamhomes-9bfa3.firebasestorage.app',
    apiKey: 'AIzaSyCMgpIMVd_2aKBx9fTp4D6_E1icSkxvRws',
    // Back to the default domain (not dreamhouse-vizag.web.app). Pointing
    // this at the custom site fixed the earlier init.json 404, but broke
    // Google Sign-In instead (redirect_uri_mismatch) — the Google OAuth
    // client Firebase auto-creates is only pre-authorized for this default
    // domain's /__/auth/handler, not a custom Hosting site's. The real fix
    // was deploying actual content to this default domain too (see the
    // "default" Hosting target in firebase.json), so it no longer 404s.
    authDomain: 'dreamhomes-9bfa3.firebaseapp.com',
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
