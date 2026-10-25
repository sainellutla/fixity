import { useCivicStore } from '../../hooks/useCivicStore'
import { Sheet } from '../ui/Sheet'

interface FeedItem {
  id: string
  issueId: string
  issueTitle: string
  label: string
  createdAt: number
}

export function CommunityActivity({ open, onClose, onOpenIssue }: { open: boolean; onClose: () => void; onOpenIssue: (id: string) => void }) {
  const { state } = useCivicStore()

  const items: FeedItem[] = []
  for (const issue of Object.values(state.issues)) {
    for (const event of issue.timelineEvents) {
      items.push({ id: event.id, issueId: issue.id, issueTitle: issue.title, label: `${event.label} — ${event.description}`, createdAt: event.createdAt })
    }
  }
  items.sort((a, b) => b.createdAt - a.createdAt)

  return (
    <Sheet open={open} onClose={onClose} size="md" title="Community Activity">
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
        {items.slice(0, 40).map((item) => (
          <button key={item.id} className="cl-card text-left" onClick={() => { onOpenIssue(item.issueId); onClose() }}>
            <div className="text-xs cl-muted">{item.issueTitle}</div>
            <div className="text-sm">{item.label}</div>
            <div className="text-xs cl-muted mt-1">{new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
