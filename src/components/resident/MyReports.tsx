import { useMemo } from 'react'
import { Award, Eye, Flag, MessageCircle, Sparkles, Trophy } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import { useCurrentResident } from '../../hooks/useCurrentResident'
import { civicRecord, POINTS } from '../../lib/engine/points'
import { PriorityPill, StatusPill } from '../shared/StatusPill'
import { Meter } from '../ui/Gauge'
import { Sheet } from '../ui/Sheet'

const BADGE_ICONS: Record<string, typeof Award> = {
  'first-report': Flag,
  'first-spotter': Eye,
  confirmer: Award,
  voice: MessageCircle,
  spark: Sparkles,
}

export function MyReports({ open, onClose, onOpenIssue }: { open: boolean; onClose: () => void; onOpenIssue: (id: string) => void }) {
  const { state } = useCivicStore()
  const { residentId, resident } = useCurrentResident()
  const record = useMemo(() => civicRecord(state, residentId), [state, residentId])

  const myReportIssueIds = new Set(
    Object.values(state.reports).filter((r) => r.residentId === residentId).map((r) => r.issueId),
  )
  const issues = Object.values(state.issues).filter((i) => myReportIssueIds.has(i.id)).sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <Sheet open={open} onClose={onClose} size="md" title="My Reports">
      <section className="cl-side-card is-gold" style={{ background: 'rgba(242,181,68,.08)', borderColor: 'rgba(242,181,68,.45)' }}>
        <div className="flex items-center gap-4">
          <div className="grid place-items-center rounded-full" style={{ width: 64, height: 64, border: '4px solid var(--cl-accent)', color: 'var(--cl-accent)', transform: 'rotate(-8deg)' }}>
            <span className="cl-display text-3xl font-black">{record.level}</span>
          </div>
          <div className="flex-1">
            <p className="cl-kicker is-good" style={{ color: 'var(--cl-accent-2)' }}><Trophy size={13} /> {resident.name}'s Civic Record</p>
            <h3 className="text-2xl">{record.levelName}</h3>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--cl-text-dim)' }}>
              <span>{record.points} civic points</span>
              <span>{record.nextLevelAt ? `${record.nextLevelAt - record.points} to next level` : 'Max level'}</span>
            </div>
            <div className="mt-1"><Meter value={record.levelProgress} color="#f2b544" /></div>
          </div>
        </div>

        <div className="cl-badges mt-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {record.badges.map((b) => {
            const Icon = BADGE_ICONS[b.id] ?? Award
            return (
              <div key={b.id} className={`cl-badge ${b.earned ? 'is-on' : ''}`} title={b.hint}>
                <span className="cl-badge-seal"><Icon size={18} /></span>
                <span className="font-semibold">{b.label}</span>
              </div>
            )
          })}
        </div>
        <p className="cl-fineprint">
          Report +{POINTS.report} · First to spot +{POINTS.firstSpot} · Confirm a neighbor +{POINTS.confirm} · Ask a question +{POINTS.question} · Your report gets fixed +{POINTS.fixSparked}. Demo scoring only.
        </p>
      </section>

      <h3 className="mt-4 mb-2">Your reports</h3>
      {issues.length === 0 && <p className="cl-muted">You haven't submitted any reports yet. Pin your first issue to earn the First Report badge.</p>}
      <div className="flex flex-col gap-2">
        {issues.map((issue) => (
          <button key={issue.id} className="cl-card is-clickable text-left" onClick={() => { onOpenIssue(issue.id); onClose() }}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{issue.title}</span>
              <div className="flex gap-2"><PriorityPill priority={issue.priority} /><StatusPill status={issue.status} /></div>
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
