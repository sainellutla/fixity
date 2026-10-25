import { useEffect, useState } from 'react'
import { NotificationCenter } from '../shared/NotificationCenter'
import { PortalSwitch } from '../shared/PortalSwitch'
import { BrandMark } from '../ui/Brand'
import { MetricCards } from './MetricCards'
import type { Issue, Notification } from '../../lib/types'

interface LeadershipTopbarProps {
  issues: Issue[]
  notifications: Notification[]
  onOpenIssue: (id: string) => void
  onOpenQueue: () => void
}

export function LeadershipTopbar({ issues, notifications, onOpenIssue, onOpenQueue }: LeadershipTopbarProps) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="cl-topbar">
      <div className="cl-hud-brand">
        <BrandMark size={38} />
        <div>
          <span className="cl-hud-brand-name">City of Manteca <em>· demo</em></span>
          <span className="cl-hud-brand-sub">Municipal Operations Dashboard</span>
        </div>
      </div>

      <MetricCards issues={issues} onOpenQueue={onOpenQueue} />

      <div className="flex flex-col items-end px-2">
        <span className="cl-hud-clock">{now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
        <span className="text-xs" style={{ color: 'var(--cl-text-dim)' }}>{now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>

      <NotificationCenter notifications={notifications} onOpenIssue={onOpenIssue} />
      <PortalSwitch />
    </header>
  )
}
