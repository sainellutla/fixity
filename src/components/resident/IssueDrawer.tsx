import { ReportDescription } from '../shared/ReportDescription'
import { Heart, MapPin, ShieldCheck, X } from 'lucide-react'
import { LensFace } from '../ui/Brand'
import { useCivicStore } from '../../hooks/useCivicStore'
import { useCurrentResident } from '../../hooks/useCurrentResident'
import { AiBadge } from '../shared/AiBadge'
import { PriorityPill, StatusPill } from '../shared/StatusPill'
import { Timeline } from '../shared/Timeline'
import { CommentThread } from '../shared/CommentThread'
import { VerificationPrompt } from './VerificationPrompt'
import { CATEGORY_LABELS } from '../../lib/departments'
import { displayCode } from '../../lib/ids'
import type { Issue } from '../../lib/types'

interface IssueDrawerProps {
  issue: Issue
  onClose: () => void
}

export function ResidentIssueDrawer({ issue, onClose }: IssueDrawerProps) {
  const { state, actions } = useCivicStore()
  const { residentId, resident } = useCurrentResident()

  const reports = issue.reportIds.map((id) => state.reports[id]).filter(Boolean)
  const updates = Object.values(state.updates).filter((u) => u.issueId === issue.id).sort((a, b) => a.createdAt - b.createdAt)
  const comments = Object.values(state.comments).filter((c) => c.issueId === issue.id)
  const followKey = `${residentId}:${issue.id}`
  const isFollowing = Boolean(state.follows[followKey])
  const latestUpdate = updates[updates.length - 1]
  const isResolvedAwaitingVerification = issue.status === 'resolved'

  return (
    <aside className="cl-dock cl-dock-right">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="cl-label" style={{ color: "var(--cl-accent)" }}>{displayCode(issue.id)}</div>
          <h2 className="text-2xl font-extrabold leading-none mt-0.5">{issue.title}</h2>
        </div>
        <button className="cl-icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
      </div>

      <div className="flex gap-2 mt-2">
        <PriorityPill priority={issue.priority} />
        <StatusPill status={issue.status} />
      </div>

      <div className="flex items-center gap-1 text-sm cl-muted mt-2">
        <MapPin size={13} /> {CATEGORY_LABELS[issue.category]}
      </div>

      <button
        className="cl-link mt-2"
        onClick={() => actions.toggleFollow(residentId, issue.id, !isFollowing)}
      >
        <Heart size={14} fill={isFollowing ? 'currentColor' : 'none'} style={{ color: isFollowing ? 'var(--cl-critical)' : undefined }} />
        {isFollowing ? 'Following this issue' : 'Follow this issue'}
      </button>

      <section className="cl-side-card mt-3">
        <div className="cl-advisor-head">
          <LensFace size={38} />
          <div>
            <strong>LENS says</strong>
            <AiBadge />
          </div>
        </div>
        <p className="cl-advisor-quote">{issue.consensusSummary ?? issue.aiAnalysis.reasoning}</p>
        {reports.length > 1 && (
          <p className="text-xs mt-2" style={{ color: 'var(--cl-accent-2)' }}>{reports.length} independent reports · {new Set(reports.map((r) => r.residentId)).size} unique residents</p>
        )}
      </section>

      {reports.length > 0 && (
        <section className="mt-3">
          <h3 className="mb-2">Resident Descriptions</h3>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {reports.map((r) => (
              <ReportDescription key={r.id} report={r} />
            ))}
          </div>
        </section>
      )}

      {latestUpdate && (
        <section className="mt-3">
          <div className="cl-card is-good">
            <p className="cl-kicker is-good"><ShieldCheck size={13} /> Official City Update</p>
            <div className="cl-display text-lg font-bold">{latestUpdate.title}</div>
            <p className="text-sm cl-muted mt-1">{latestUpdate.message}</p>
            {latestUpdate.estimatedResolution && <p className="text-xs mt-1">Estimated resolution: {latestUpdate.estimatedResolution}</p>}
          </div>
        </section>
      )}

      <section className="mt-3">
        <h3 className="mb-2">Timeline</h3>
        <Timeline events={issue.timelineEvents} />
      </section>

      {isResolvedAwaitingVerification && (
        <section className="mt-3">
          <VerificationPrompt issueId={issue.id} />
        </section>
      )}

      <section className="mt-3">
        <h3 className="mb-2">Questions</h3>
        <CommentThread issueId={issue.id} comments={comments} authorId={residentId} authorRole="resident" authorLabel={resident.name} />
      </section>
    </aside>
  )
}
