import { Chrome, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Field } from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { friendlyAuthError } from '../lib/validation'

export function SignIn() {
  const { user, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/account'
  if (user) return <Navigate to="/account" replace />

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await signIn(email.trim(), password); navigate(destination, { replace: true }) }
    catch (reason) { setError(friendlyAuthError(reason)) }
    finally { setBusy(false) }
  }

  async function google() {
    setError(''); setBusy(true)
    try { await signInWithGoogle(); navigate('/account', { replace: true }) }
    catch (reason) { setError(friendlyAuthError(reason)) }
    finally { setBusy(false) }
  }

  return <AuthLayout showBrand={false}>
    <div className="form-heading"><span className="eyebrow">WELCOME BACK</span><h2>Continue your flow</h2><p>Sign in to pick up right where you left off.</p></div>
    {params.get('reset') === 'complete' && <div className="notice success">Password updated. You can now sign in.</div>}
    {error && <div className="notice error" role="alert">{error}</div>}
    <button className="button google-button" type="button" onClick={google} disabled={busy}><Chrome size={19} /> Continue with Google</button>
    <div className="divider"><span>or continue with email</span></div>
    <form onSubmit={submit} className="form-stack">
      <Field label="Email address" icon={<Mail size={18} />} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Field label="Password" icon={<LockKeyhole size={18} />} type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <div className="form-row"><label className="check"><input type="checkbox" /> <span>Remember me</span></label><Link to="/forgot-password">Forgot password?</Link></div>
      <button className="button primary-button" disabled={busy}>{busy ? <span className="mini-loader" /> : 'Sign in to BiasSense AI'}</button>
    </form>
    <p className="form-footer">New to BiasSense AI? <Link to="/signup">Create an account</Link></p>
  </AuthLayout>
}
