import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { DEPARTMENTS } from '../../lib/departments'
import type { Issue, IssueStatus } from '../../lib/types'

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

interface PublishResponsePanelProps {
  open: boolean
  onClose: () => void
  issue: Issue
  onPublish: (input: { title: string; message: string; status: IssueStatus; departmentId: string | null; estimatedResolution: string | null }) => void
  prefill?: { title: string; message: string; departmentId?: string } | null
}

export function PublishResponsePanel({ open, onClose, issue, onPublish, prefill }: PublishResponsePanelProps) {
  const [title, setTitle] = useState(prefill?.title ?? '')
  const [status, setStatus] = useState<IssueStatus>('in_progress')
  const [departmentId, setDepartmentId] = useState(issue.assignedDepartment ?? '')
  const [message, setMessage] = useState(prefill?.message ?? '')
  const [eta, setEta] = useState('')

  useEffect(() => {
    if (!open) return
    setDepartmentId(prefill?.departmentId ?? issue.assignedDepartment ?? '')
    if (prefill) {
      setTitle(prefill.title)
      setMessage(prefill.message)
    }
  }, [open]) // re-seed only when the panel opens, not on every issue update while editing

  function draftWithAi() {
    setTitle(`${issue.aiAnalysis.issueType} — City Response`)
    setMessage(
      `We are aware of the reported ${issue.aiAnalysis.issueType.toLowerCase()} and have prioritized an assessment. ${issue.aiAnalysis.recommendedAction}. We will provide another update as the situation develops.`,
    )
  }

  function handlePublish() {
    if (!title.trim() || !message.trim()) return
    onPublish({ title: title.trim(), message: message.trim(), status, departmentId: departmentId || null, estimatedResolution: eta.trim() || null })
    setTitle(''); setMessage(''); setEta('')
  }

  return (
    <Sheet open={open} onClose={onClose} size="md" title="Publish Official Response">
      <div className="flex flex-col gap-4">
        <button className="cl-link self-start" onClick={draftWithAi}><Sparkles size={14} /> Draft Response with AI</button>

        <div>
          <label className="cl-label">Response Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Traffic Signal Repair Underway" className="cl-input mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="cl-label">Current Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus)} className="cl-input mt-1">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="cl-label">Assigned Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="cl-input mt-1">
              <option value="">Unassigned</option>
              {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="cl-label">Public Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={800} className="cl-input mt-1 resize-none" />
        </div>

        <div>
          <label className="cl-label">Estimated Resolution (optional)</label>
          <input value={eta} onChange={(e) => setEta(e.target.value)} placeholder="2 hours" className="cl-input mt-1" />
        </div>

        <Button variant="primary" size="lg" full onClick={handlePublish}>Publish Update</Button>
      </div>
    </Sheet>
  )
}
