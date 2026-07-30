import { Bell, CircleHelp, Download, LayoutDashboard, LogOut, Menu, Settings, Sparkles, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brand } from './Brand'

export function AppShell({ children, title, subtitle }: { children: ReactNode, title: string, subtitle: string }) {
  const { profile, user, logout } = useAuth()
  const [menu, setMenu] = useState(false)
  const navigate = useNavigate()
  const initials = (profile?.fullName || user?.email || 'FF').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  async function exit() { await logout(); navigate('/signin') }
  return <div className="app-shell">
    <div className="aurora aurora-one" /><div className="aurora aurora-two" />
    <aside className={`sidebar glass-card ${menu ? 'open' : ''}`}>
      <div className="sidebar-top"><Brand /><button className="icon-button mobile-close" onClick={() => setMenu(false)} aria-label="Close menu"><X /></button></div>
      <nav aria-label="Main navigation">
        <NavLink to="/dashboard"><LayoutDashboard size={19} /> Overview</NavLink>
        <NavLink to="/settings"><Settings size={19} /> Profile & settings</NavLink>
        <NavLink to="/install"><Download size={19} /> Install app</NavLink>
      </nav>
      <div className="sidebar-callout"><Sparkles size={20} /><strong>Stay in your flow</strong><p>Small, consistent progress compounds into remarkable work.</p></div>
      <button className="profile-chip" onClick={() => navigate('/settings')}>
        <span className="profile-avatar">{initials}</span><span><strong>{profile?.fullName || 'BiasSense AI member'}</strong><small>{profile?.email || user?.email}</small></span>
      </button>
      <button className="sidebar-logout" onClick={exit}><LogOut size={17} /> Sign out</button>
    </aside>
    <main className="app-main">
      <header className="app-header">
        <button className="icon-button mobile-menu" onClick={() => setMenu(true)} aria-label="Open menu"><Menu /></button>
        <div><span className="eyebrow">BIASSENSE AI WORKSPACE</span><h1>{title}</h1><p>{subtitle}</p></div>
        <div className="header-actions"><button className="icon-button" aria-label="Help"><CircleHelp /></button><button className="icon-button notification" aria-label="Notifications"><Bell /><i /></button><span className="profile-avatar">{initials}</span></div>
      </header>
      {children}
    </main>
    {menu && <button className="menu-backdrop" onClick={() => setMenu(false)} aria-label="Close menu" />}
  </div>
}
