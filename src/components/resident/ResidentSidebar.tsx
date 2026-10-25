import { Activity, Eye, FileText, Heart, LayoutGrid, Plus, Settings, Trophy } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import { residentRemark } from '../../lib/engine/advisor'
import type { CivicRecord } from '../../lib/engine/points'
import { BrandMark, LensFace } from '../ui/Brand'
import { Meter } from '../ui/Gauge'
import { IdentitySwitcher } from './IdentitySwitcher'

export type ResidentView = 'overview' | 'map' | 'myReports' | 'following' | 'activity' | 'settings'

interface ResidentSidebarProps {
  view: ResidentView
  onViewChange: (v: ResidentView) => void
  onStartReport: () => void
  record: CivicRecord
  followingCount: number
  collapsed: boolean
}

export function ResidentSidebar({ view, onViewChange, onStartReport, record, followingCount, collapsed }: ResidentSidebarProps) {
  const { state } = useCivicStore()
  if (collapsed) return null

  const nav: { id: ResidentView; label: string; icon: typeof LayoutGrid; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'map', label: 'Explore Map', icon: Eye },
    { id: 'myReports', label: 'My Reports', icon: FileText, count: record.reports },
    { id: 'following', label: 'Following', icon: Heart, count: followingCount },
    { id: 'activity', label: 'Community Activity', icon: Activity },
    { id: 'settings', label: 'Demo Settings', icon: Settings },
  ]

  return (
    <nav className="cl-dock cl-dock-left" aria-label="Resident navigation">
      <div className="flex items-center gap-2 px-1">
        <BrandMark size={30} />
        <span className="cl-display text-xl font-extrabold">Fixity</span>
      </div>

      <button className="cl-btn cl-btn-primary cl-btn-xl full" onClick={onStartReport}>
        <Plus size={20} />
        <span className="cl-btn-stack">
          <span className="cl-display" style={{ fontSize: 22, fontWeight: 800 }}>Report an Issue</span>
          <small>Pin a problem · earn civic points</small>
        </span>
      </button>

      <div className="cl-nav">
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

      <button className="cl-side-card text-left w-full" onClick={() => onViewChange('myReports')} style={{ color: 'inherit' }}>
        <div className="cl-side-head" style={{ marginBottom: 6 }}>
          <h3 className="flex items-center gap-2"><Trophy size={15} style={{ color: 'var(--cl-accent)' }} /> Civic Record</h3>
          <span className="cl-ai-badge is-gold">Lv {record.level}</span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-bold">{record.levelName}</span>
          <span style={{ color: 'var(--cl-text-dim)' }}>{record.nextLevelAt ? `${record.points} / ${record.nextLevelAt} pts` : `${record.points} pts · max level`}</span>
        </div>
        <div className="mt-2"><Meter value={record.levelProgress} color="#f2b544" /></div>
      </button>

      <section className="cl-side-card mt-auto">
        <div className="cl-advisor-head">
          <LensFace size={38} />
          <div>
            <strong>LENS</strong>
            <span>Your civic guide · demo</span>
          </div>
        </div>
        <p className="cl-advisor-quote" style={{ fontSize: 13.5 }}>{residentRemark(state)}</p>
      </section>

      <IdentitySwitcher />
    </nav>
  )
}
