import { CheckCircle2, Flame, Layers, MapPin, Search, Trophy, Wrench } from 'lucide-react'
import { NotificationCenter } from '../shared/NotificationCenter'
import { PortalSwitch } from '../shared/PortalSwitch'
import { BrandMark } from '../ui/Brand'
import { Gauge } from '../ui/Gauge'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import type { Issue, Notification } from '../../lib/types'
import type { CivicRecord } from '../../lib/engine/points'

interface ResidentTopbarProps {
  residentName: string
  issues: Issue[]
  record: CivicRecord
  notifications: Notification[]
  search: string
  onSearchChange: (v: string) => void
  onOpenIssue: (issueId: string) => void
  onOpenRecord: () => void
}

function isActive(status: Issue['status']) {
  return status !== 'resolved' && status !== 'community_verified'
}

export function ResidentTopbar({ residentName, issues, record, notifications, search, onSearchChange, onOpenIssue, onOpenRecord }: ResidentTopbarProps) {
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const total = Math.max(1, issues.length)
  const open = issues.filter((i) => isActive(i.status)).length
  const critical = issues.filter((i) => i.priority === 'critical' && isActive(i.status)).length
  const fixing = issues.filter((i) => i.status === 'in_progress').length
  const fixed = issues.filter((i) => !isActive(i.status)).length

  return (
    <header className="cl-topbar">
      <div className="cl-hud-brand">
        <BrandMark size={38} />
        <div>
          <span className="cl-hud-brand-name">{greeting}, Manteca.</span>
          <span className="cl-hud-brand-sub"><MapPin size={11} /> Manteca, CA · Resident Portal</span>
        </div>
      </div>

      <div className="cl-gauges" role="group" aria-label="Your neighborhood">
        <Gauge icon={<Layers size={15} />} value={open} label="Open Issues" color="#f2b544" meter={(open / total) * 100} />
        <Gauge icon={<Flame size={15} />} value={critical} label="Critical" color="#e5583a" meter={(critical / total) * 100} danger={critical > 0} />
        <Gauge icon={<Wrench size={15} />} value={fixing} label="Being Fixed" color="#49b4d6" meter={(fixing / total) * 100} />
        <Gauge icon={<CheckCircle2 size={15} />} value={fixed} label="Fixed" color="#6cbf5a" meter={(fixed / total) * 100} />
      </div>

      <div className="relative" style={{ width: 200 }}>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cl-text-faint)' }} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search issues, report IDs…"
          className="cl-input"
          style={{ paddingLeft: 32, borderRadius: 999 }}
        />
      </div>

      <button className="cl-points" onClick={onOpenRecord} aria-label={`${record.points} civic points, level ${record.level}`}>
        <Trophy size={17} />
        <span>
          <span className="cl-points-value"><AnimatedNumber value={record.points} /></span>
          <span className="cl-points-sub">Lv {record.level} · {record.levelName}</span>
        </span>
      </button>

      <NotificationCenter notifications={notifications} onOpenIssue={onOpenIssue} />
      <div className="w-9 h-9 rounded-full grid place-items-center text-sm font-extrabold cl-display" style={{ background: 'var(--cl-accent)', color: 'var(--cl-ink)', border: '2px solid var(--cl-ink)', boxShadow: '0 0 0 2px var(--cl-accent)' }}>
        {residentName.split(' ').map((p) => p[0]).join('')}
      </div>
      <PortalSwitch />
    </header>
  )
}
