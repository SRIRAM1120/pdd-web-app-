import { BriefcaseBusiness, Building2, Mail, Phone, Save, ShieldCheck, User } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AppShell } from '../components/AppShell'
import { Field } from '../components/Field'
import { useAuth } from '../context/AuthContext'

export function Settings() {
  const { profile, user, updateProfile } = useAuth()
  const [form, setForm] = useState({ fullName: '', phone: '', organization: '', role: '' })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (profile) setForm({ fullName: profile.fullName, phone: profile.phone, organization: profile.organization, role: profile.role })
  }, [profile])
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setStatus('')
    try { await updateProfile(form); setStatus('Your profile has been updated.') }
    catch { setStatus('We could not save your changes. Try again.') }
    finally { setBusy(false) }
  }
  return <AppShell title="Profile & settings" subtitle="Keep your workspace details up to date.">
    <div className="settings-layout">
      <form className="glass-card settings-card" onSubmit={submit}>
        <div className="panel-heading"><div><span className="eyebrow">PERSONAL DETAILS</span><h2>Your profile</h2></div><span className="metric-icon purple"><User /></span></div>
        {status && <div className="notice success">{status}</div>}
        <div className="form-grid">
          <Field label="Full name" icon={<User size={18} />} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required />
          <Field label="Phone" icon={<Phone size={18} />} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Field label="Organization" icon={<Building2 size={18} />} value={form.organization} onChange={(e) => set('organization', e.target.value)} />
          <Field label="Role" icon={<BriefcaseBusiness size={18} />} value={form.role} onChange={(e) => set('role', e.target.value)} />
        </div>
        <Field label="Email address" icon={<Mail size={18} />} value={user?.email ?? ''} disabled />
        <button className="button primary-button save-button" disabled={busy}><Save size={17} /> {busy ? 'Saving…' : 'Save changes'}</button>
      </form>
      <aside className="glass-card security-card"><span className="metric-icon cyan"><ShieldCheck /></span><span className="eyebrow">ACCOUNT SECURITY</span><h2>Your account is protected</h2><p>Your session is securely managed by Firebase Authentication. Passwords are never stored in BiasSense AI.</p><div className="security-line"><span>Email verification</span><strong>{user?.emailVerified ? 'Verified' : 'Pending'}</strong></div><div className="security-line"><span>Sign-in method</span><strong>{profile?.authProvider === 'google.com' ? 'Google' : 'Email'}</strong></div></aside>
    </div>
  </AppShell>
}
