import { ReportDescription } from '../shared/ReportDescription'
import { useState } from 'react'
import { ClipboardList, MapPin, Mic, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { assessUrgency, TIER_LABEL } from '../../lib/engine/urgency'
import { languageLabel } from '../../lib/voiceScripts'
import { LensFace } from '../ui/Brand'
import { useCivicStore } from '../../hooks/useCivicStore'
import { AiBadge } from '../shared/AiBadge'
import { PriorityPill, StatusPill } from '../shared/StatusPill'
import { Timeline } from '../shared/Timeline'
import { CommentThread } from '../shared/CommentThread'
import { Button } from '../ui/Button'
import { CATEGORY_LABELS, DEPARTMENTS, departmentById } from '../../lib/departments'
import { displayCode } from '../../lib/ids'
import { PublishResponsePanel } from './PublishResponsePanel'
import type { Issue } from '../../lib/types'

export function LeadershipIssueDrawer({ issue, onClose, onOpenPlan }: { issue: Issue; onClose: () => void; onOpenPlan: () => void }) {
  const { state, actions } = useCivicStore()
  const [publishOpen, setPublishOpen] = useState(false)

  const reports = issue.reportIds.map((id) => state.reports[id]).filter(Boolean)
  const comments = Object.values(state.comments).filter((c) => c.issueId === issue.id)
  const department = departmentById(issue.assignedDepartment)
  const urgency = assessUrgency(issue, state)
  const spokenLanguages = [...new Set(reports.map((r) => r.spokenLanguage).filter((l): l is NonNullable<typeof l> => Boolean(l) && l !== "en"))]

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
        <span className={`cl-tier-chip cl-tier cl-tier-${urgency.tier}`} title={urgency.rationale}>{TIER_LABEL[urgency.tier]}{urgency.tier !== 'closed' ? ` · ${urgency.score}` : ''}</span>
        <StatusPill status={issue.status} />
      </div>

      <div className="flex items-center gap-1 text-sm cl-muted mt-2">
        <MapPin size={13} /> {CATEGORY_LABELS[issue.category]} · {reports.length} report{reports.length === 1 ? '' : 's'}
        {spokenLanguages.length > 0 && <span className="cl-spoken-tag ml-1"><Mic size={11} /> Voice report · {spokenLanguages.map(languageLabel).join(", ")}</span>}
      </div>

      {issue.followUpRequested && (
        <div className="cl-card is-alert mt-3">
          <p className="cl-kicker" style={{ margin: 0 }}><TriangleAlert size={13} /> Resident requested follow-up.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cl-text-dim)' }}>A resident says this is not fixed. One response isn't proof the repair failed — review before reopening.</p>
        </div>
      )}

      <section className="cl-side-card mt-3 flex flex-wrap gap-2">
        <h3 className="w-full">City Actions</h3>
        {issue.status === 'reported' && (
          <Button size="default" onClick={() => actions.setStatus(issue.id, 'acknowledged', 'Acknowledged', 'City leadership reviewed the report.')}>Acknowledge Issue</Button>
        )}
        {issue.status !== 'in_progress' && issue.status !== 'resolved' && issue.status !== 'community_verified' && (
          <Button size="default" onClick={() => actions.setStatus(issue.id, 'in_progress', 'In Progress', 'City leadership marked this in progress.')}>Mark In Progress</Button>
        )}
        <Button variant="soft" size="default" className="w-full" onClick={onOpenPlan}><ClipboardList size={15} /> LENS Action Plan · step by step</Button>
        <Button variant="primary" size="default" onClick={() => setPublishOpen(true)}>Publish Official Update</Button>
        {issue.status !== 'resolved' && issue.status !== 'community_verified' && (
          <Button variant="success" size="default" onClick={() => actions.setStatus(issue.id, 'resolved', 'Resolved', 'City leadership marked this issue resolved.')}>Mark Resolved</Button>
        )}
        {(issue.status === 'resolved' || issue.status === 'community_verified' || issue.status === 'reopened') && (
          <Button size="default" onClick={() => actions.reopenIssue(issue.id)}><RotateCcw size={14} /> Reopen Issue</Button>
        )}
        <div className="w-full mt-1">
          <label className="cl-label">Assign Department</label>
          <select value={issue.assignedDepartment ?? ''} onChange={(e) => actions.assignDepartment(issue.id, e.target.value)} className="cl-input mt-1">
            <option value="">Unassigned</option>
            {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {department && <p className="text-xs mt-1" style={{ color: 'var(--cl-text-dim)' }}>{department.description}</p>}
        </div>
      </section>

      <section className="cl-side-card mt-3">
        <div className="cl-advisor-head">
          <LensFace size={40} />
          <div>
            <strong>LENS Analysis</strong>
            <AiBadge />
          </div>
        </div>
        <p className="cl-advisor-quote">{issue.consensusSummary ?? issue.aiAnalysis.reasoning}</p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 text-sm">
          <dt className="cl-label">Issue Type</dt><dt className="cl-label">Confidence</dt>
          <dd className="font-semibold">{issue.aiAnalysis.issueType}</dd><dd className="font-semibold">{issue.aiAnalysis.confidence}</dd>
          <dt className="cl-label mt-1 col-span-2">Suggested Department</dt>
          <dd className="font-semibold col-span-2">{issue.aiAnalysis.suggestedDepartment}</dd>
        </dl>
      </section>

      {reports.length > 0 && (
        <section className="mt-3">
          <h3 className="mb-2">Resident Descriptions</h3>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {reports.map((r) => (
              <ReportDescription key={r.id} report={r} showTime />
            ))}
          </div>
        </section>
      )}

      <section className="mt-3">
        <h3 className="mb-2">Timeline</h3>
        <Timeline events={issue.timelineEvents} />
      </section>

      <section className="mt-3">
        <h3 className="mb-2">Community Questions</h3>
        <CommentThread issueId={issue.id} comments={comments} authorId="city-leadership" authorRole="leadership" authorLabel="City Leadership" />
      </section>

      <PublishResponsePanel
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        issue={issue}
        onPublish={(input) => {
          actions.publishUpdate(issue.id, { ...input, author: 'City Leadership Demo Portal' })
          setPublishOpen(false)
        }}
      />
    </aside>
  )
}
