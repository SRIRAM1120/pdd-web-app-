import { ArrowRight, CheckCircle2, FileSearch, LogOut, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

export function Home() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const firstName = profile?.fullName?.split(' ')[0] || 'there'
  async function signOut() {
    await logout()
    navigate('/', { replace: true })
  }

  return <main className="nature-home">
    <div className="nature-background" />
    <header className="nature-nav">
      <Brand />
      <nav>
        <span className="home-user">Welcome, {firstName}</span>
        <button type="button" className="nature-login home-logout" onClick={signOut}><LogOut size={16} /> Sign out</button>
      </nav>
    </header>

    <section className="nature-hero">
      <div className="nature-copy">
        <span className="nature-eyebrow"><Sparkles size={15} /> YOUR PRIVATE WORKSPACE</span>
        <h1>Welcome to your<br /><em>natural flow.</em></h1>
        <p>Your secure account is ready. Analyze documents privately, review meaningful insights, and keep your work moving forward.</p>
        <div className="nature-actions">
          <button type="button" className="button nature-primary"><FileSearch size={18} /> Analyze a document <ArrowRight size={18} /></button>
        </div>
        <div className="nature-trust">
          <span><ShieldCheck /> Secure account</span>
          <span><CheckCircle2 /> Account active</span>
        </div>
      </div>

      <aside className="nature-glass-card">
        <span className="nature-card-icon"><Sparkles /></span>
        <span className="nature-eyebrow">YOUR WORKSPACE</span>
        <h2>Everything starts here.</h2>
        <p>This home page is available only after authentication. Your account access and session are securely managed by Firebase.</p>
        <div className="nature-card-line"><span>01</span><p><strong>Select a document</strong><small>Choose the information you want to review.</small></p></div>
        <div className="nature-card-line"><span>02</span><p><strong>Analyze privately</strong><small>Keep your workflow focused and protected.</small></p></div>
        <div className="nature-card-line"><span>03</span><p><strong>Review your results</strong><small>Return to your secure workspace anytime.</small></p></div>
      </aside>
    </section>

    <footer className="nature-footer"><span>© 2026 BiasSense AI</span><span>Private authenticated workspace</span></footer>
  </main>
}
