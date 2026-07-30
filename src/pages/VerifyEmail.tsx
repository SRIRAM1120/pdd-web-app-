import { CheckCircle2, LogOut, MailCheck, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'
import { friendlyAuthError } from '../lib/validation'

export function VerifyEmail() {
  const { user, resendVerification, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  if (!user) return <Navigate to="/signin" replace />
  if (user.emailVerified || user.providerData.some((p) => p.providerId === 'google.com')) return <Navigate to="/home" replace />
  const currentUser = user
  async function refresh() {
    setBusy(true); setMessage('')
    try { await refreshUser(); if (currentUser.emailVerified) navigate('/home') }
    catch (reason) { setMessage(friendlyAuthError(reason)) }
    finally { setBusy(false) }
  }
  async function resend() {
    setBusy(true)
    try { await resendVerification(); setMessage('A fresh verification email is on its way.') }
    catch (reason) { setMessage(friendlyAuthError(reason)) }
    finally { setBusy(false) }
  }
  return <AuthLayout compact><div className="centered-state">
    <span className="state-icon"><MailCheck size={30} /></span><span className="eyebrow">ONE QUICK STEP</span>
    <h2>Verify your email</h2><p>We sent a verification link to <strong>{user.email}</strong>. Open it, then come back here.</p>
    {message && <div className="notice success"><CheckCircle2 size={16} /> {message}</div>}
    <button className="button primary-button" onClick={refresh} disabled={busy}><RefreshCw size={17} /> I’ve verified my email</button>
    <button className="button secondary-button" onClick={resend} disabled={busy}>Resend verification email</button>
    <button className="text-button" onClick={logout}><LogOut size={15} /> Use another account</button>
  </div></AuthLayout>
}
