import { Chrome, LockKeyhole, Mail, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Field } from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { EMAIL_PATTERN, friendlyAuthError, passwordIssues } from '../lib/validation'

type SignUpDraft = {
  fullName: string
  email: string
  password: string
  confirm: string
  terms: boolean
}

const emptyDraft: SignUpDraft = {
  fullName: '',
  email: '',
  password: '',
  confirm: '',
  terms: false
}

// Keep unfinished registration details in memory while the user reads the
// legal pages. Passwords are intentionally not written to session/local storage.
let signUpDraft: SignUpDraft = { ...emptyDraft }

export function SignUp() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<SignUpDraft>(() => signUpDraft)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = <Key extends keyof SignUpDraft>(key: Key, value: SignUpDraft[Key]) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      signUpDraft = next
      return next
    })
  }

  function validate() {
    const next: Record<string, string> = {}
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name.'
    if (!EMAIL_PATTERN.test(form.email)) next.email = 'Enter a valid email address.'
    const issues = passwordIssues(form.password)
    if (issues.length) next.password = `Include ${issues.join(', ')}.`
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.'
    if (!form.terms) next.terms = 'Accept the terms to continue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return
    setBusy(true); setError('')
    try {
      await signUp({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: '',
        organization: '',
        role: ''
      })
      signUpDraft = { ...emptyDraft }
      navigate('/account', { replace: true })
    } catch (reason) { setError(friendlyAuthError(reason)) }
    finally { setBusy(false) }
  }

  async function google() {
    setBusy(true); setError('')
    try { await signInWithGoogle(); navigate('/account') }
    catch (reason) { setError(friendlyAuthError(reason)) }
    finally { setBusy(false) }
  }

  return <AuthLayout>
    <div className="form-heading"><span className="eyebrow">CREATE ACCOUNT</span><h2>Start with the basics</h2><p>It only takes a minute to set up your secure account.</p></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    <button className="button google-button" type="button" onClick={google} disabled={busy}><Chrome size={19} /> Continue with Google</button>
    <div className="divider"><span>or use your email</span></div>
    <form onSubmit={submit} className="form-stack">
      <Field label="Full name" icon={<User size={18} />} autoComplete="name" placeholder="Your name" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} error={errors.fullName} />
      <Field label="Email address" icon={<Mail size={18} />} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
      <Field label="Password" icon={<LockKeyhole size={18} />} type="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} />
      <Field label="Confirm password" icon={<LockKeyhole size={18} />} type="password" autoComplete="new-password" placeholder="Repeat your password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} error={errors.confirm} />
      <label className="check"><input type="checkbox" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} /><span>I agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span></label>
      {errors.terms && <span className="field-error">{errors.terms}</span>}
      <button className="button primary-button" disabled={busy}>{busy ? <span className="mini-loader" /> : 'Create account'}</button>
    </form>
    <p className="form-footer">Already have an account? <Link to="/signin">Sign in</Link></p>
  </AuthLayout>
}
