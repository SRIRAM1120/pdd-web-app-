import { CheckCircle2, LogOut, Mail, ShieldCheck, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

export function Account() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  async function exit() { await logout(); navigate('/signin') }
  return <main className="auth-page account-page">
    <div className="auth-photo" />
    <header className="auth-header"><Brand /><button className="button glass-button" onClick={exit}><LogOut size={16} /> Sign out</button></header>
    <section className="glass-card account-card">
      <span className="state-icon"><CheckCircle2 /></span>
      <span className="eyebrow">SIGNED IN SECURELY</span>
      <h1>Welcome, {profile?.fullName?.split(' ')[0] || 'there'}.</h1>
      <p>Your account is ready. This is the complete signed-in state for the authentication system.</p>
      <div className="account-details">
        <div><User /><span><small>NAME</small><strong>{profile?.fullName || 'BiasSense AI member'}</strong></span></div>
        <div><Mail /><span><small>EMAIL</small><strong>{user?.email}</strong></span></div>
        <div><ShieldCheck /><span><small>STATUS</small><strong>{user?.emailVerified ? 'Email verified' : 'Secure Google account'}</strong></span></div>
      </div>
      <button className="button primary-button" onClick={exit}>Sign out</button>
    </section>
  </main>
}
