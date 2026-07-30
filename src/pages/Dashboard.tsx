import { ArrowUpRight, CalendarDays, Check, CheckCircle2, Circle, Clock3, Flame, MoreHorizontal, Plus, Sparkles, Target, TrendingUp, Users } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { useAuth } from '../context/AuthContext'

const tasks = [
  { title: 'Review product launch brief', tag: 'Strategy', color: 'purple', time: '9:30 AM', done: true },
  { title: 'Prepare design critique notes', tag: 'Design', color: 'cyan', time: '11:00 AM', done: false },
  { title: 'Weekly team progress sync', tag: 'Team', color: 'pink', time: '2:00 PM', done: false },
  { title: 'Outline next sprint priorities', tag: 'Planning', color: 'amber', time: '4:30 PM', done: false }
]

export function Dashboard() {
  const { profile } = useAuth()
  const firstName = profile?.fullName?.split(' ')[0] || 'there'
  return <AppShell title={`Good morning, ${firstName}.`} subtitle="Here's what deserves your focus today.">
    <section className="dashboard-grid">
      <div className="metric glass-card"><span className="metric-icon purple"><CheckCircle2 /></span><div><small>TASKS COMPLETED</small><strong>12</strong><span className="trend"><TrendingUp size={14} /> 18% this week</span></div></div>
      <div className="metric glass-card"><span className="metric-icon cyan"><Clock3 /></span><div><small>FOCUS TIME</small><strong>4h 32m</strong><span>of 6h daily goal</span></div></div>
      <div className="metric glass-card"><span className="metric-icon pink"><Flame /></span><div><small>FOCUS STREAK</small><strong>8 days</strong><span>Personal best: 14</span></div></div>
      <div className="metric glass-card"><span className="metric-icon amber"><Target /></span><div><small>WEEKLY PROGRESS</small><strong>78%</strong><span className="progress"><i style={{ width: '78%' }} /></span></div></div>

      <section className="glass-card task-panel">
        <div className="panel-heading"><div><span className="eyebrow">TODAY · 4 TASKS</span><h2>Your focus list</h2></div><button className="button small-button"><Plus size={17} /> Add task</button></div>
        <div className="task-list">
          {tasks.map((task) => <div className={`task ${task.done ? 'done' : ''}`} key={task.title}>
            <button className="task-check" aria-label={`Mark ${task.title} complete`}>{task.done ? <Check /> : <Circle />}</button>
            <div><strong>{task.title}</strong><span><i className={`tag-dot ${task.color}`} />{task.tag}</span></div>
            <small><Clock3 size={14} /> {task.time}</small><button className="icon-button" aria-label="Task options"><MoreHorizontal /></button>
          </div>)}
        </div>
        <button className="panel-link">View all tasks <ArrowUpRight size={15} /></button>
      </section>

      <aside className="dashboard-side">
        <section className="glass-card focus-card">
          <div className="panel-heading"><div><span className="eyebrow">DEEP WORK</span><h2>Focus session</h2></div><Sparkles /></div>
          <div className="focus-ring"><span><strong>25:00</strong><small>minutes</small></span></div>
          <p>Silence distractions and make progress on what matters.</p><button className="button primary-button">Start focusing</button>
        </section>
        <section className="glass-card activity-card">
          <div className="panel-heading"><h2>Coming up</h2><CalendarDays /></div>
          <div className="event"><span className="metric-icon cyan"><Users /></span><div><strong>Design team sync</strong><small>Today · 2:00 PM</small></div></div>
          <div className="event"><span className="metric-icon purple"><Target /></span><div><strong>Sprint planning</strong><small>Tomorrow · 10:00 AM</small></div></div>
        </section>
      </aside>
    </section>
  </AppShell>
}
