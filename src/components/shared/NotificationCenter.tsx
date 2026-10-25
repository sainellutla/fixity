import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import type { Notification } from '../../lib/types'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function NotificationCenter({ notifications, onOpenIssue }: { notifications: Notification[]; onOpenIssue?: (issueId: string) => void }) {
  const { actions } = useCivicStore()
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length
  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20)

  return (
    <div className="relative">
      <button className="cl-icon-btn relative" onClick={() => setOpen((v) => !v)} aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--cl-critical)] text-white text-[10px] font-bold grid place-items-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto cl-card z-30" style={{ background: 'var(--cl-surface-2)' }}>
          {sorted.length === 0 && <p className="cl-muted text-sm">No notifications yet.</p>}
          {sorted.map((n) => (
            <button
              key={n.id}
              className="w-full text-left py-2 px-1 border-b border-white/5 last:border-0"
              onClick={() => {
                actions.markNotificationRead(n.id)
                onOpenIssue?.(n.issueId)
                setOpen(false)
              }}
            >
              <div className="flex items-center gap-2">
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--cl-accent)]" />}
                <span className="text-sm font-semibold">{n.title}</span>
              </div>
              <p className="text-xs text-[var(--cl-text-dim)] mt-0.5 line-clamp-2">{n.message}</p>
              <span className="text-xs text-[var(--cl-text-faint)]">{formatTime(n.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
