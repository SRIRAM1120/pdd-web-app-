import { ArrowLeft, Mail, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Field } from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { EMAIL_PATTERN, friendlyAuthError } from '../lib/validation'

export function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!EMAIL_PATTERN.test(email)) return
    setBusy(true); setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch (resetError) {
      const code = typeof resetError === 'object' && resetError && 'code' in resetError ? String(resetError.code) : ''
      // Do not reveal whether a particular address has an account.
      if (code === 'auth/user-not-found') setSent(true)
      else setError(friendlyAuthError(resetError))
    } finally {
      setBusy(false)
    }
  }
  return <AuthLayout compact>
    {sent ? <div className="centered-state">
      <span className="state-icon"><Send size={28} /></span>
      <span className="eyebrow">CHECK YOUR INBOX</span><h2>Reset link sent</h2>
      <p>If an account exists for <strong>{email}</strong>, you’ll receive a secure password reset link shortly.</p>
      <Link className="button primary-button" to="/signin">Back to sign in</Link>
    </div> : <>
      <div className="form-heading"><span className="eyebrow">RESET PASSWORD</span><h2>Let’s get you back in</h2><p>Enter your email and we’ll send you a secure reset link.</p></div>
      <form onSubmit={submit} className="form-stack">
        <Field label="Email address" icon={<Mail size={18} />} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button primary-button" disabled={busy || !EMAIL_PATTERN.test(email)}>{busy ? <span className="mini-loader" /> : 'Send reset link'}</button>
      </form>
      <Link className="back-center" to="/signin"><ArrowLeft size={16} /> Back to sign in</Link>
    </>}
  </AuthLayout>
}
