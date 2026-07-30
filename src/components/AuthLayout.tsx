import type { ReactNode } from 'react'
import { Brand } from './Brand'

export function AuthLayout({
  children,
  compact = false,
  showBrand = true
}: {
  children: ReactNode
  compact?: boolean
  showBrand?: boolean
}) {
  return <main className="auth-page">
    <div className="auth-photo" />
    <header className="auth-header">
      {showBrand && <Brand />}
      <span className="secure-label">Secure account access</span>
    </header>
    <section className={`auth-shell ${compact ? 'compact' : ''}`}>
      <div className="glass-card auth-card">{children}</div>
    </section>
  </main>
}
