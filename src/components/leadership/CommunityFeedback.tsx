import { Sheet } from '../ui/Sheet'
import { useCivicStore } from '../../hooks/useCivicStore'

export function CommunityFeedback({ open, onClose, onOpenIssue }: { open: boolean; onClose: () => void; onOpenIssue: (id: string) => void }) {
  const { state } = useCivicStore()
  const comments = Object.values(state.comments)
    .filter((c) => c.authorRole === 'resident')
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <Sheet open={open} onClose={onClose} size="md" title="Community Feedback">
      {comments.length === 0 && <p className="cl-muted">No resident questions yet.</p>}
      <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
        {comments.map((c) => {
          const issue = state.issues[c.issueId]
          return (
            <button key={c.id} className="cl-card text-left" onClick={() => { onOpenIssue(c.issueId); onClose() }}>
              <div className="text-xs cl-muted">{issue?.title ?? 'Unknown issue'}{c.flagged ? ' · Flagged' : ''}</div>
              <p className="text-sm mt-1">{c.message}</p>
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
