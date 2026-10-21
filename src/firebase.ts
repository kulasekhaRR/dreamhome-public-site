import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// A Firebase web config is not a secret — it's meant to be embedded in
// client-side code. Security is enforced by Firestore/Auth rules and
// authorized domains, not by hiding this object. See firestore.rules.
const firebaseConfig = {
    projectId: 'dreamhomes-9bfa3',
    appId: '1:1086324151008:web:b125b4e1d0741f62027685',
    storageBucket: 'dreamhomes-9bfa3.firebasestorage.app',
    apiKey: 'AIzaSyCMgpIMVd_2aKBx9fTp4D6_E1icSkxvRws',
    authDomain: 'dreamhomes-9bfa3.firebaseapp.com',
    messagingSenderId: '1086324151008',
    measurementId: 'G-TPLL7ZXW22',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
