import { Activity, BarChart3, Book, Landmark, ListOrdered, MessageSquare, Settings, Sparkles } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import { leadershipRemark } from '../../lib/engine/advisor'
import { rankIssues } from '../../lib/engine/urgency'
import { BrandMark, LensFace } from '../ui/Brand'

export type LeadershipView = 'command' | 'queue' | 'ai' | 'projects' | 'feedback' | 'directory' | 'performance' | 'settings'

interface LeadershipSidebarProps {
  view: LeadershipView
  onViewChange: (v: LeadershipView) => void
}

export function LeadershipSidebar({ view, onViewChange }: LeadershipSidebarProps) {
  const { state } = useCivicStore()
  const issues = Object.values(state.issues)
  const actNow = rankIssues(state).filter((r) => r.urgency.tier === 'act_now').length
  const activeProjects = issues.filter((i) => i.status === 'in_progress' || i.status === 'acknowledged' || i.status === 'under_review').length
  const questions = Object.values(state.comments).filter((c) => c.authorRole === 'resident').length

  const nav: { id: LeadershipView; label: string; icon: typeof Landmark; count?: number }[] = [
    { id: 'command', label: 'Command Center', icon: Landmark },
    { id: 'queue', label: 'Urgency Ranking', icon: ListOrdered, count: actNow },
    { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
    { id: 'projects', label: 'Active Projects', icon: Activity, count: activeProjects },
    { id: 'feedback', label: 'Community Feedback', icon: MessageSquare, count: questions },
    { id: 'directory', label: 'Resource Directory', icon: Book },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="cl-dock cl-dock-left" aria-label="Leadership navigation">
      <div className="flex items-center gap-2 px-1">
        <BrandMark size={30} />
        <span className="cl-display text-xl font-extrabold">Fixity</span>
      </div>
      <span className="cl-ai-badge is-muted self-start ml-1">Demo City Leadership</span>

      <div className="cl-nav mt-1">
        {nav.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} className={`cl-nav-item ${item.id === view ? 'is-on' : ''}`} onClick={() => onViewChange(item.id)}>
              <Icon size={16} /> {item.label}
              {item.count ? <span className="cl-nav-count">{item.count}</span> : null}
            </button>
          )
        })}
      </div>

      <section className="cl-side-card mt-auto">
        <div className="cl-advisor-head">
          <LensFace size={42} />
          <div>
            <strong>LENS</strong>
            <span>Fixity Advisory Logic · demo</span>
          </div>
        </div>
        <p className="cl-advisor-quote">{leadershipRemark(state)}</p>
        <button className="cl-btn cl-btn-soft full mt-3" onClick={() => onViewChange('ai')}>
          <Sparkles size={15} /> Ask LENS for a briefing
        </button>
      </section>
    </nav>
  )
}
