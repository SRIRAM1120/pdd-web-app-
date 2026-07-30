import { CheckCircle2, Chrome, Download, Monitor, MoreVertical, PlusSquare, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function Install() {
  return <main className="content-page">
    <div className="aurora aurora-one" /><div className="aurora aurora-two" />
    <header className="home-nav"><Brand /><Link className="button nav-button" to="/dashboard">Open app</Link></header>
    <section className="content-hero"><span className="state-icon"><Download /></span><span className="eyebrow">BIASSENSE AI, EVERYWHERE</span><h1>Install the app</h1><p>Get a focused, full-screen experience from Chrome—no app store required.</p></section>
    <section className="install-grid">
      <article className="glass-card install-card"><span className="metric-icon purple"><Monitor /></span><h2>Chrome on desktop</h2><ol><li><span>1</span><p>Open BiasSense AI in Google Chrome.</p></li><li><span>2</span><p>Click the <strong>Install</strong> icon in the right side of the address bar. If it is hidden, open the Chrome menu.</p></li><li><span>3</span><p>Select <strong>Install BiasSense AI</strong>, then confirm.</p></li></ol><div className="install-hint"><Chrome /> Address bar <PlusSquare /> Install</div></article>
      <article className="glass-card install-card"><span className="metric-icon cyan"><Smartphone /></span><h2>Chrome on Android</h2><ol><li><span>1</span><p>Open BiasSense AI in Chrome on your phone.</p></li><li><span>2</span><p>Tap the three-dot Chrome menu in the top-right corner.</p></li><li><span>3</span><p>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p></li></ol><div className="install-hint"><MoreVertical /> Chrome menu <Download /> Install app</div></article>
    </section>
    <div className="install-benefits glass-card"><span><CheckCircle2 /> Launch from your home screen</span><span><CheckCircle2 /> Distraction-free window</span><span><CheckCircle2 /> Useful offline screen</span><span><CheckCircle2 /> Automatic updates</span></div>
  </main>
}
