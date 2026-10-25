import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Award, BellRing, X } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import type { AuthorRole, Notification } from '../../lib/types'

interface Achievement {
  id: string
  title: string
  message: string
}

interface ToastsProps {
  role: AuthorRole
  residentId?: string
  onOpenIssue?: (issueId: string) => void
  achievements?: Achievement[]
}

// Module-level so it survives switching portals within the same tab.
const toastedThisTab = new Set<string>()

type Item = { kind: 'notification'; n: Notification } | { kind: 'achievement'; a: Achievement }

function itemId(item: Item) {
  return item.kind === 'notification' ? item.n.id : item.a.id
}

export function Toasts({ role, residentId, onOpenIssue, achievements = [] }: ToastsProps) {
  const { state } = useCivicStore()
  const [visible, setVisible] = useState<Item[]>([])
  const seenRef = useRef<Set<string> | null>(null)
  const seenAchievements = useRef(new Set<string>())

  function isSticky(item: Item) {
    return item.kind === 'notification' && role === 'leadership' && state.issues[item.n.issueId]?.priority === 'critical'
  }

  // The other portal is usually a background tab when an update lands, so the dismiss
  // countdown only starts once this tab is visible; critical alerts stay until handled.
  function scheduleDismiss(item: Item) {
    if (isSticky(item)) return
    const start = () => setTimeout(() => setVisible((prev) => prev.filter((v) => itemId(v) !== itemId(item))), 7000)
    if (!document.hidden) {
      start()
      return
    }
    const onVisible = () => {
      if (document.hidden) return
      document.removeEventListener('visibilitychange', onVisible)
      start()
    }
    document.addEventListener('visibilitychange', onVisible)
  }

  function show(items: Item[]) {
    setVisible((prev) => [...prev, ...items])
    items.forEach(scheduleDismiss)
  }

  function dismiss(id: string) {
    setVisible((prev) => prev.filter((v) => itemId(v) !== id))
  }

  useEffect(() => {
    const relevant = Object.values(state.notifications).filter(
      (n) => n.targetRole === role && (role === 'leadership' || n.targetResidentId === residentId),
    )
    if (seenRef.current === null) {
      // Surface very recent unread alerts on mount — e.g. after flipping portals in the same tab.
      const cutoff = Date.now() - 2 * 60 * 1000
      seenRef.current = new Set(relevant.filter((n) => n.read || n.createdAt < cutoff || toastedThisTab.has(n.id)).map((n) => n.id))
    }
    const fresh = relevant.filter((n) => !seenRef.current!.has(n.id))
    if (fresh.length === 0) return
    for (const n of fresh) {
      seenRef.current.add(n.id)
      toastedThisTab.add(n.id)
    }
    show(fresh.map((n) => ({ kind: 'notification', n })))
  }, [state.notifications, role, residentId])

  useEffect(() => {
    const fresh = achievements.filter((a) => !seenAchievements.current.has(a.id))
    if (fresh.length === 0) return
    for (const a of fresh) seenAchievements.current.add(a.id)
    show(fresh.map((a) => ({ kind: 'achievement', a })))
  }, [achievements])

  if (visible.length === 0) return null

  const achievementItems = visible.flatMap((v) => (v.kind === 'achievement' ? [v.a] : []))
  const notificationItems = visible.flatMap((v) => (v.kind === 'notification' ? [v.n] : []))

  return (
    <>
      {achievementItems.length > 0 && (
        <div className="cl-toasts is-front">
          {achievementItems.map((a) => (
            <div key={a.id} className="cl-toast is-achievement">
              <span className="cl-toast-badge"><Award size={18} /></span>
              <div className="cl-toast-body">
                <b className="cl-display" style={{ fontSize: 17 }}>{a.title}</b>
                <span className="cl-muted" style={{ margin: 0 }}>{a.message}</span>
              </div>
              <button className="cl-toast-x" onClick={() => dismiss(a.id)} aria-label="Dismiss"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {notificationItems.length > 0 && (
        <div className="cl-toasts">
          {notificationItems.map((n) => {
            const issue = state.issues[n.issueId]
            const critical = role === 'leadership' && issue?.priority === 'critical'
            return (
              <div key={n.id} className={`cl-toast ${critical ? 'is-critical' : 'is-info'}`}>
                <span className="cl-toast-badge">{critical ? <AlertTriangle size={17} /> : <BellRing size={17} />}</span>
                <div className="cl-toast-body">
                  <b>{critical && n.title === 'New Resident Issue Detected' ? 'Critical Issue Detected' : n.title}</b>
                  <span className="cl-muted" style={{ margin: 0 }}>{n.message}</span>
                  {role === 'leadership' && issue && (
                    <span className="text-xs" style={{ color: 'var(--cl-text-faint)' }}>
                      Priority: {issue.priority[0].toUpperCase() + issue.priority.slice(1)} · Manteca, CA
                    </span>
                  )}
                  {onOpenIssue && (
                    <button className="cl-toast-action" onClick={() => { onOpenIssue(n.issueId); dismiss(n.id) }}>
                      Review Issue
                    </button>
                  )}
                </div>
                <button className="cl-toast-x" onClick={() => dismiss(n.id)} aria-label="Dismiss"><X size={14} /></button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
