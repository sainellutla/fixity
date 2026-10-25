import { useCivicStore } from '../../hooks/useCivicStore'
import { useCurrentResident } from '../../hooks/useCurrentResident'
import { PriorityPill, StatusPill } from '../shared/StatusPill'
import { Sheet } from '../ui/Sheet'

export function Following({ open, onClose, onOpenIssue }: { open: boolean; onClose: () => void; onOpenIssue: (id: string) => void }) {
  const { state } = useCivicStore()
  const { residentId } = useCurrentResident()

  const followedIds = new Set(
    Object.values(state.follows).filter((f) => f.residentId === residentId).map((f) => f.issueId),
  )
  const issues = Object.values(state.issues).filter((i) => followedIds.has(i.id))

  return (
    <Sheet open={open} onClose={onClose} size="md" title="Following">
      {issues.length === 0 && <p className="cl-muted">You're not following any issues yet. Follow an issue from its detail panel.</p>}
      <div className="flex flex-col gap-2">
        {issues.map((issue) => (
          <button key={issue.id} className="cl-card text-left" onClick={() => { onOpenIssue(issue.id); onClose() }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{issue.title}</span>
              <div className="flex gap-2"><PriorityPill priority={issue.priority} /><StatusPill status={issue.status} /></div>
            </div>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
