import { Sheet } from '../ui/Sheet'
import { PriorityPill, StatusPill } from '../shared/StatusPill'
import { useCivicStore } from '../../hooks/useCivicStore'
import { departmentById } from '../../lib/departments'

export function ActiveProjects({ open, onClose, onOpenIssue }: { open: boolean; onClose: () => void; onOpenIssue: (id: string) => void }) {
  const { state } = useCivicStore()
  const issues = Object.values(state.issues)
    .filter((i) => i.status === 'in_progress' || i.status === 'acknowledged' || i.status === 'under_review')
    .sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <Sheet open={open} onClose={onClose} size="lg" title="Active Projects">
      {issues.length === 0 && <p className="cl-muted">No issues currently in an active workflow stage.</p>}
      <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
        {issues.map((issue) => {
          const dept = departmentById(issue.assignedDepartment)
          return (
            <button key={issue.id} className="cl-card text-left" onClick={() => { onOpenIssue(issue.id); onClose() }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{issue.title}</span>
                <div className="flex gap-2"><PriorityPill priority={issue.priority} /><StatusPill status={issue.status} /></div>
              </div>
              <p className="text-xs cl-muted mt-1">{dept ? dept.name : 'Unassigned'} · {issue.reportIds.length} report{issue.reportIds.length === 1 ? '' : 's'}</p>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
