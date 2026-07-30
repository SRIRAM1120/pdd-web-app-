import { BarChart3, CheckCircle2, Clock3, Download, FileSearch, History, Home, LogOut, Plus, Printer, RefreshCw, Search, Share2, TrendingUp, Upload, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { analyzeText, count, readDocument, type AnalysisReport as Report } from '../lib/labAnalysis'
import { reportPdf } from '../lib/reportExport'
import { saveAnalysis, savePreferences, useUserData } from '../lib/userData'

type Tab = 'home' | 'analyze' | 'trends' | 'reports' | 'profile'

const allowed = ['pdf','jpg','jpeg','png','webp','txt','csv','xls','xlsx','doc','docx']

export function LabWorkspace() {
  const { profile, user, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<Tab>('home')
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [result, setResult] = useState<Report | null>(null)
  const [dataRefresh, setDataRefresh] = useState(0)
  const userData = useUserData(user?.uid, dataRefresh)
  const reports = userData.reports
  const [query, setQuery] = useState('')
  const [profileForm, setProfileForm] = useState({ fullName:'', role:'', organization:'', country:'', emailAlerts:false })
  const [profileStatus, setProfileStatus] = useState('')
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const filtered = useMemo(() => reports.filter((report) => `${report.fileName || ''} ${report.type} ${report.summary} ${report.metrics.map((m) => m.name).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [reports, query])
  useEffect(() => {
    const source = userData.preferences ?? profile
    if (source) setProfileForm({
      fullName:String(source.fullName || ''),
      role:String(source.role || ''),
      organization:String(source.organization || ''),
      country:String(source.country || ''),
      emailAlerts:Boolean(source.emailAlerts)
    })
  }, [profile, userData.preferences])
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setInstallPrompt(event) }
    window.addEventListener('beforeinstallprompt', capture)
    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [])
  async function installApp() {
    if (installPrompt && 'prompt' in installPrompt) {
      await (installPrompt as Event & { prompt: () => Promise<void> }).prompt()
      setInstallPrompt(null)
    } else setProfileStatus('In Chrome, open the menu and choose “Install BiasSense AI” or “Add to Home screen”.')
  }
  async function saveProfile() {
    if (!profileForm.fullName.trim()) return setProfileStatus('Full name is required.')
    if (!user) return setProfileStatus('Authentication is required.')
    try {
      const preferences = { ...profileForm, fullName:profileForm.fullName.trim() }
      await Promise.all([updateProfile(preferences), savePreferences(user.uid, preferences)])
      setProfileStatus('Profile saved.')
    }
    catch { setProfileStatus('Profile could not be saved. Check your connection and try again.') }
  }

  function choose(selected?: File) {
    setResult(null); setValidation(''); setFile(null)
    if (!selected) return
    const extension = selected.name.split('.').pop()?.toLowerCase() || ''
    if (!allowed.includes(extension)) return setValidation('Unsupported file. Select PDF, image, TXT, CSV, Excel, or Word.')
    if (!selected.size) return setValidation('The selected file is empty.')
    if (selected.size > 25 * 1024 * 1024) return setValidation('The selected file is larger than 25 MB.')
    setFile(selected)
  }

  async function analyze() {
    if (!file || processing) return
    setProcessing(true); setValidation(''); setProgress(12)
    try {
      const text = await readDocument(file, (value, message) => { setProgress(value); setStage(message) })
      setProgress(92); setStage('Structuring metrics and generating findings')
      const report = analyzeText(text, file.name)
      setProgress(100); setStage('Analysis complete'); setResult(report)
      if (!user) throw new Error('Authentication is required before saving an analysis.')
      await saveAnalysis(user.uid, report)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const safe = message.startsWith('No readable') || message.startsWith('OCR ') || message.startsWith('Legacy ') || message.startsWith('This PDF') || message.startsWith('The selected') || message.startsWith('No readable spreadsheet')
        ? message
        : `The ${file.name.split('.').pop()?.toUpperCase() || 'document'} file could not be analyzed. It may be corrupted, password-protected, or unreadable. Try exporting a clearer PDF, JPG, PNG, CSV, or DOCX.`
      setValidation(safe)
      console.error(`BiasSense analysis failed during "${stage || 'document reading'}":`, error)
    }
    finally { setProcessing(false) }
  }

  async function exit() { await logout(); navigate('/signin') }

  return <main className="lab-app">
    <header className="lab-topbar"><div><span className="lab-logo"><img src="/app-logo.png" alt="" /> BiasSense <i>AI</i></span></div><div className="lab-top-actions"><button className="lab-install-button" onClick={installApp}><Download /> Install app</button><button className="lab-icon-button" onClick={exit} aria-label="Sign out"><LogOut /></button></div></header>
    <section className="lab-content">
      {userData.offline && <div className="profile-status" role="status">Offline mode: showing cached Firebase data. New records will appear when the connection returns.</div>}
      {userData.error === 'permission-denied' && <div className="lab-error" role="alert">Firebase permission denied. Publish the included Firestore rules for this project.</div>}
      {userData.error === 'read-failure' && <div className="lab-error" role="alert">Firebase data could not be loaded. Check the connection and try again.</div>}
      {userData.error === 'invalid-data' && <div className="lab-error" role="alert">Some Firebase records have invalid or unsupported data.</div>}
      {tab === 'home' && <div className="lab-screen">
        <section className="lab-home-hero">
          <div className="lab-heading"><h1>Welcome back{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}!</h1><p>Your laboratory analysis workspace</p></div>
          <button className="quick-upload" onClick={() => setTab('analyze')}>
            <span><strong>Quick Upload</strong><small>Start analyzing your lab files</small></span><i><Upload /></i>
          </button>
        </section>
        <section className="lab-home-card">
          <div className="lab-section-title"><h2>AI Status</h2></div>
          <div className="lab-stats"><LabStat label="Total analyses" value={reports.length} /><LabStat label="Completed" value={reports.length} /></div>
        </section>
        <section className="lab-home-card">
          <div className="lab-section-title"><h2>Recent Analysis</h2>{reports.length > 4 && <button onClick={() => setTab('reports')}>View all</button>}</div>
          {userData.loading ? <Empty icon={<History />} text="Loading Firebase records…" /> : !reports.length ? <Empty icon={<History />} text="No saved analyses yet. Start a new analysis below." /> : reports.slice(0, 4).map((report) => <ReportRow key={report.id} report={report} />)}
        </section>
        <button className="lab-primary home-start-button" onClick={() => setTab('analyze')}><Plus /> Start New Analysis</button>
      </div>}

      {tab === 'analyze' && <div className="lab-screen">
        <div className="lab-heading center"><h1>Bias Lab</h1><p>Private local document analysis</p></div>
        {!result ? <>
          <button className="lab-upload-card" onClick={() => input.current?.click()}>
            <span><Upload /></span><h2>Select a lab report or health document</h2>
            <p>PDF, image, TXT, CSV, XLS, XLSX, DOC, or DOCX · maximum 25 MB</p>
            <strong>{file ? 'Choose another file' : 'Browse Files'}</strong>
          </button>
          <input ref={input} hidden type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.xls,.xlsx,.doc,.docx" onChange={(event) => choose(event.target.files?.[0])} />
          {file && <div className="selected-file"><FileSearch /><div><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(1)} KB · ready for local analysis</small></div><CheckCircle2 /></div>}
          {validation && <div className="lab-error">{validation}</div>}
          {processing && <div className="scanner-stage"><div className="scanner-document"><FileSearch /><i /></div><h3>Bias Lab Local Analysis</h3><p>{stage}</p><div className="lab-progress"><span style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>}
          <button className="lab-primary" disabled={!file || processing} onClick={analyze}>{processing ? 'Analyzing…' : 'Analyze Document'}</button>
          <p className="lab-privacy">Documents are read locally. Only the filename and structured analysis are saved; file paths, contents, and original files are not uploaded or stored.</p>
        </> : <Result report={result} scanAgain={() => { setResult(null); setFile(null); setProgress(0) }} />}
      </div>}

      {tab === 'reports' && <div className="lab-screen">
        <div className="lab-heading"><h1>Reports History</h1><p>Completed local analyses</p></div>
        {reports.length > 1 && <Comparison current={reports[0]} previous={reports[1]} />}
        <label className="lab-search"><Search /><input placeholder="Search history" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        {!filtered.length ? <Empty icon={<BarChart3 />} text="No matching analyses are available." /> : filtered.map((report) => <ReportRow key={report.id} report={report} />)}
      </div>}

      {tab === 'trends' && <div className="lab-screen trends-screen">
        <div className="trends-heading"><div className="lab-heading"><h1>Health Trends</h1><p>Local findings, comparisons, and recommendations</p></div><button onClick={() => setDataRefresh((value) => value + 1)}><RefreshCw /> Refresh</button></div>
        {reports.length > 1 ? <Comparison current={reports[0]} previous={reports[1]} /> : <div className="lab-summary trends-comparison"><h3>Metric comparison</h3><p>Add at least two reports to compare metric changes.</p></div>}
        {!reports.length ? <Empty icon={<TrendingUp />} text="Analyze a report to see health trends, findings, and recommendations." /> : reports.map((report) => <TrendCard key={report.id} report={report} />)}
      </div>}

      {tab === 'profile' && <div className="lab-screen">
        <div className="lab-heading"><h1>Profile</h1><p>Your secure account</p></div>
        <div className="lab-profile-card editable"><span><User /></span><h2>Profile details</h2><p>{user?.email}</p>
          <div className="profile-form">
            <label>Full name<input value={profileForm.fullName} onChange={(event)=>setProfileForm({...profileForm,fullName:event.target.value})} placeholder="Your full name" /></label>
            <label>Role<input value={profileForm.role} onChange={(event)=>setProfileForm({...profileForm,role:event.target.value})} placeholder="Laboratory specialist" /></label>
            <label>Organization<input value={profileForm.organization} onChange={(event)=>setProfileForm({...profileForm,organization:event.target.value})} placeholder="Clinical organization" /></label>
            <label>Country<input value={profileForm.country} onChange={(event)=>setProfileForm({...profileForm,country:event.target.value})} placeholder="Country" /></label>
            <label className="profile-toggle"><span><strong>Email alerts</strong><small>Store your notification preference with your account.</small></span><input type="checkbox" checked={profileForm.emailAlerts} onChange={(event)=>setProfileForm({...profileForm,emailAlerts:event.target.checked})} /></label>
          </div>
          {profileStatus && <div className="profile-status" role="status">{profileStatus}</div>}
          <button className="lab-primary" onClick={saveProfile}>Save Profile</button>
          <button className="lab-secondary" onClick={installApp}><Download /> Download app (PWA)</button>
        </div>
        <button className="lab-secondary" onClick={() => user?.email && navigate(`/forgot-password`)}>Reset Password</button>
        <button className="lab-danger" onClick={exit}>Log Out</button>
      </div>}
    </section>
    <nav className="lab-bottom-nav">
      <NavButton active={tab === 'home'} icon={<Home />} label="Home" onClick={() => setTab('home')} />
      <NavButton active={tab === 'analyze'} icon={<Upload />} label="Analyze" onClick={() => setTab('analyze')} />
      <NavButton active={tab === 'trends'} icon={<TrendingUp />} label="Trends" onClick={() => setTab('trends')} />
      <NavButton active={tab === 'reports'} icon={<History />} label="Reports" onClick={() => setTab('reports')} />
      <NavButton active={tab === 'profile'} icon={<User />} label="Profile" onClick={() => setTab('profile')} />
    </nav>
  </main>
}

function LabStat({ label, value }: { label: string; value: number }) { return <div className="lab-stat"><small>{label}</small><strong>{value}</strong></div> }
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) { return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<small>{label}</small><i /></button> }
function Empty({ icon, text }: { icon: ReactNode; text: string }) { return <div className="lab-empty">{icon}<p>{text}</p></div> }
function ReportRow({ report }: { report: Report }) {
  const download = () => reportPdf(report).save(`BiasSense-${(report.fileName || report.type).replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-')}.pdf`)
  return <div className="lab-report-row">
    <span><FileSearch /></span>
    <div><strong>{report.fileName || report.type}</strong>{report.fileName && <p>{report.type}</p>}<small><Clock3 /> {report.date}</small><p>{report.summary}</p></div>
    <button className="report-download" onClick={download} aria-label={`Download ${report.fileName || report.type} as PDF`} title="Download PDF"><Download /></button>
  </div>
}
function Comparison({current,previous}:{current:Report;previous:Report}){const rows=current.metrics.map((now)=>({now,before:previous.metrics.find((old)=>old.name.toLowerCase()===now.name.toLowerCase())})).filter((row)=>row.before);return <div className="lab-summary comparison"><h3>Latest report comparison</h3>{rows.length?rows.map(({now,before})=><div key={now.name}><strong>{now.name}</strong><span>{before!.value} → {now.value} {now.unit}</span><em>{now.value===before!.value?'Stable':now.value<before!.value?'Decreased':'Increased'}</em></div>):<p>No overlapping metrics were found between the latest two reports.</p>}</div>}
function TrendCard({ report }: { report: Report }) {
  return <article className="trend-card">
    <header><div><h2>{report.fileName || report.type}</h2>{report.fileName && <p>{report.type}</p>}</div><span>Completed</span></header>
    <section><h3>Findings</h3><ul>{report.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul></section>
    <section><h3>Recommendations</h3><ul>{report.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul></section>
  </article>
}
function Result({ report, scanAgain }: { report: Report; scanAgain: () => void }) {
  const totals=count(report.metrics)
  const download=()=>reportPdf(report).save(`BiasSense-${report.type.replace(/\s+/g,'-')}.pdf`)
  const print=()=>{const url=reportPdf(report).output('bloburl');const frame=document.createElement('iframe');frame.style.display='none';frame.src=url.toString();document.body.append(frame);frame.onload=()=>frame.contentWindow?.print()}
  const share=async()=>{const blob=reportPdf(report).output('blob');const file=new File([blob],`BiasSense-${report.type}.pdf`,{type:'application/pdf'});if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({title:report.type,files:[file]});else download()}
  return <div className="lab-result"><div className="lab-result-head"><span><CheckCircle2 /> ANALYZED</span><h2>{report.fileName || report.type}</h2>{report.fileName && <p>{report.type}</p>}<p>{report.date}</p></div>
    <div className="result-counts"><div><strong>{totals.Normal}</strong><small>Normal</small></div><div><strong>{totals.Good}</strong><small>Good</small></div><div><strong>{totals.Anomaly}</strong><small>Anomaly</small></div></div>
    <div className="lab-summary"><h3>Analysis summary</h3><p>{report.summary}</p></div>
    {report.metrics.length ? <div className="lab-metrics detailed"><div className="metric-header"><span>Lab test</span><span>Result</span><span>Unit</span><span>Reference</span><span>Extraction</span><span>Classification</span></div>{report.metrics.map((metric) => <div key={metric.name}><strong>{metric.name}</strong><span>{metric.value}</span><span>{metric.unit||'—'}</span><span>{metric.referenceRange}</span><span>{metric.extractionStatus}</span><em className={metric.classification.toLowerCase()}>{metric.classification}</em></div>)}</div> : <Empty icon={<FileSearch />} text="No structured metrics were detected. Upload a clearer document containing visible test names and values." />}
    <div className="insight-grid"><div className="lab-summary"><h3>Key findings</h3><ul>{report.findings.map((item)=><li key={item}>{item}</li>)}</ul></div><div className="lab-summary"><h3>Safe recommendations</h3><ul>{report.recommendations.map((item)=><li key={item}>{item}</li>)}</ul></div></div>
    <div className="report-actions"><button onClick={download}><Download/> Download PDF</button><button onClick={share}><Share2/> Share</button><button onClick={print}><Printer/> Print</button></div>
    <p className="lab-disclaimer">Private on-device analysis. Only this structured result is saved. Informational decision support only—not a medical diagnosis.</p><button className="lab-primary" onClick={scanAgain}>Scan another document</button></div>
}
