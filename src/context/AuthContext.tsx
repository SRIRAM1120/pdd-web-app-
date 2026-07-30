import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  reload,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth, authPersistenceReady, db } from '../lib/firebase'
import type { SignUpData, UserProfile } from '../types'

interface AuthValue {
  user: User | null
  profile: UserProfile | null
  initializing: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [initializing, setInitializing] = useState(true)

  async function loadProfile(activeUser: User) {
    const snapshot = await getDoc(doc(db, 'users', activeUser.uid))
    setProfile(snapshot.exists() ? snapshot.data() as UserProfile : null)
  }

  async function loadGoogleProfile(activeUser: User) {
    const ref = doc(db, 'users', activeUser.uid)
    try {
      const snapshot = await getDoc(ref)
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile)
        return
      }
      const newProfile: UserProfile = {
        fullName: activeUser.displayName ?? 'BiasSense AI member',
        phone: '',
        organization: '',
        role: '',
        country: '',
        emailAlerts: false,
        email: activeUser.email ?? '',
        authProvider: 'google.com'
      }
      await setDoc(ref, { ...newProfile, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      setProfile(newProfile)
    } catch (profileError) {
      // A Firestore rules/network problem must not turn a successful Google
      // authentication into a failed sign-in.
      console.warn('Google account connected, but profile storage is unavailable.', profileError)
    }
  }

  useEffect(() => {
    void authPersistenceReady
      .then(() => getRedirectResult(auth))
      .then((result) => result && loadGoogleProfile(result.user))
      .catch((redirectError) => console.warn('Google redirect sign-in could not be completed.', redirectError))

    return onAuthStateChanged(auth, async (activeUser) => {
      setUser(activeUser)
      if (activeUser) {
        try { await loadProfile(activeUser) } catch { setProfile(null) }
      } else {
        setProfile(null)
      }
      setInitializing(false)
    })
  }, [])

  const value = useMemo<AuthValue>(() => ({
    user,
    profile,
    initializing,
    signIn: async (email, password) => {
      await authPersistenceReady
      await signInWithEmailAndPassword(auth, email, password)
    },
    signUp: async (data) => {
      await authPersistenceReady
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const { password: _password, ...fields } = data
      void _password
      const newProfile: UserProfile = { ...fields, authProvider: 'password' }
      // Authentication must remain successful even when Firestore has not yet
      // been created or its rules have not yet been deployed.
      try {
        await setDoc(doc(db, 'users', credential.user.uid), {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      } catch (profileError) {
        console.warn('Account created, but profile storage is unavailable.', profileError)
      }
      setProfile(newProfile)
    },
    signInWithGoogle: async () => {
      await authPersistenceReady
      const provider = new GoogleAuthProvider()
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches

      // Chrome installed apps do not reliably support Firebase popup auth.
      if (isStandalone) {
        await signInWithRedirect(auth, provider)
        return
      }

      try {
        const credential = await signInWithPopup(auth, provider)
        await loadGoogleProfile(credential.user)
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
        if (code !== 'auth/popup-blocked' && code !== 'auth/operation-not-supported-in-this-environment') throw error
        await signInWithRedirect(auth, provider)
      }
    },
    resetPassword: async (email) => {
      await authPersistenceReady
      await sendPasswordResetEmail(auth, email.trim().toLowerCase())
    },
    resendVerification: async () => {
      return
    },
    refreshUser: async () => {
      if (!auth.currentUser) return
      await reload(auth.currentUser)
      setUser({ ...auth.currentUser })
    },
    updateProfile: async (data) => {
      if (!auth.currentUser) throw new Error('Not authenticated')
      await setDoc(doc(db, 'users', auth.currentUser.uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })
      setProfile((current) => current ? { ...current, ...data } : current)
    },
    logout: async () => { await signOut(auth) }
  }), [user, profile, initializing])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Auth context and hook intentionally live together as one public module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
