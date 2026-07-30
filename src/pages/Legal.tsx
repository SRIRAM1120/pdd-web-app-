import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function Legal({ type }: { type: 'privacy' | 'terms' }) {
  const privacy = type === 'privacy'
  return <main className="content-page legal-page">
    <div className="aurora aurora-one" />
    <header className="home-nav"><Brand /><Link to="/signup"><ArrowLeft size={16} /> Back to sign up</Link></header>
    <article className="glass-card legal-card">
      <span className="eyebrow">BIASSENSE AI · LAST UPDATED JULY 2026</span>
      <h1>{privacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
      <p>{privacy ? 'This policy explains how BiasSense AI handles account information in this application.' : 'These terms describe the conditions for using the BiasSense AI application.'}</p>
      {privacy ? <>
        <h2>Information we process</h2><p>We process your name, phone number, organization, role, and email to create and display your account. Firebase Authentication securely processes sign-in credentials; BiasSense AI never stores your password.</p>
        <h2>How information is used</h2><p>Your information is used only to authenticate you, maintain your profile, protect the service, and provide the requested experience.</p>
        <h2>Storage and control</h2><p>Account profiles are stored in Google Cloud Firestore and protected so each signed-in user can access only their own record. Contact the application operator to request account deletion.</p>
        <h2>Service providers</h2><p>Google Firebase provides authentication and database infrastructure. Its own terms and privacy practices also apply.</p>
      </> : <>
        <h2>Using BiasSense AI</h2><p>You must provide accurate account information, protect access to your account, and use the service lawfully.</p>
        <h2>Account access</h2><p>You are responsible for activity under your credentials. Notify the application operator if you believe your account has been compromised.</p>
        <h2>Application use</h2><p>BiasSense AI provides laboratory document analysis tools. You are responsible for reviewing generated results before relying on them.</p>
        <h2>Availability</h2><p>The service may change or become temporarily unavailable. No guarantee of uninterrupted access is made.</p>
      </>}
      <div className="legal-note">Replace this starter text with counsel-approved policies before launching a production service.</div>
    </article>
  </main>
}
