import { ArrowLeft, Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function NotFound() {
  return <main className="simple-page"><Brand /><div className="glass-card centered-state"><span className="state-icon"><Compass /></span><span className="eyebrow">404 · LOST IN THOUGHT</span><h1>That page drifted away.</h1><p>Let’s get you back to a place where progress happens.</p><Link className="button primary-button" to="/"><ArrowLeft size={17} /> Back home</Link></div></main>
}
