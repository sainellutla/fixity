import { Sheet } from '../ui/Sheet'
import { useCivicStore } from '../../hooks/useCivicStore'

export function PerformancePage({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useCivicStore()
  const issues = Object.values(state.issues)
  const total = issues.length
  const acknowledgedOrLater = issues.filter((i) => i.status !== 'reported').length
  const resolved = issues.filter((i) => i.status === 'resolved' || i.status === 'community_verified').length
  const verified = issues.filter((i) => i.status === 'community_verified').length

  const ackTimes = issues
    .map((i) => {
      const reportedAt = i.timelineEvents.find((e) => e.label === 'Reported')?.createdAt
      const ackAt = i.timelineEvents.find((e) => e.label === 'Acknowledged')?.createdAt
      return reportedAt && ackAt ? ackAt - reportedAt : null
    })
    .filter((v): v is number => v !== null)
  const avgAckMs = ackTimes.length ? ackTimes.reduce((a, b) => a + b, 0) / ackTimes.length : null

  const metrics = [
    { label: 'Issues Acknowledged or Later', value: total ? `${Math.round((acknowledgedOrLater / total) * 100)}%` : '—' },
    { label: 'Active Issues', value: String(total - resolved) },
    { label: 'Resolved Issues', value: String(resolved) },
    { label: 'Community Verification Rate', value: resolved ? `${Math.round((verified / resolved) * 100)}%` : '—' },
    { label: 'Avg. Acknowledgment Time', value: avgAckMs ? `${Math.round(avgAckMs / (60 * 60 * 1000))}h` : '—' },
  ]

  return (
    <Sheet open={open} onClose={onClose} size="md" title="Transparency Dashboard">
      <p className="cl-muted mb-3">Computed live from current demo data.</p>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="cl-card">
            <div className="text-xl font-bold" style={{ fontFamily: 'var(--display)' }}>{m.value}</div>
            <div className="text-xs cl-muted mt-1">{m.label}</div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
