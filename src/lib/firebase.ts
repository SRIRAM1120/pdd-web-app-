import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

const suppliedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined
}

export const isFirebaseConfigured = Object.values(suppliedConfig).every(Boolean)
const firebaseConfig = {
  apiKey: suppliedConfig.apiKey || 'biassense-not-configured',
  authDomain: suppliedConfig.authDomain || 'biassense-not-configured.firebaseapp.com',
  projectId: suppliedConfig.projectId || 'biassense-not-configured',
  storageBucket: suppliedConfig.storageBucket || 'biassense-not-configured.appspot.com',
  messagingSenderId: suppliedConfig.messagingSenderId || '000000000000',
  appId: suppliedConfig.appId || '1:000000000000:web:biassense'
}
export const firebaseProjectId = firebaseConfig.projectId
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export let analytics: Analytics | null = null
if (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
  void isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app)
  })
}
// Authentication actions wait for this promise. Starting a popup/redirect while
// persistence is still being changed can make Chrome lose the returned session.
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence)
