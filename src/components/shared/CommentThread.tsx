import { useState } from 'react'
import { Flag, Send, ShieldCheck } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import type { AuthorRole, Comment } from '../../lib/types'
import { Button } from '../ui/Button'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

interface CommentThreadProps {
  issueId: string
  comments: Comment[]
  authorId: string
  authorRole: AuthorRole
  authorLabel: string
}

export function CommentThread({ issueId, comments, authorId, authorRole, authorLabel }: CommentThreadProps) {
  const { actions } = useCivicStore()
  const [draft, setDraft] = useState('')
  const sorted = [...comments].sort((a, b) => a.createdAt - b.createdAt)

  function submit() {
    const trimmed = draft.trim()
    if (!trimmed) return
    actions.addComment(issueId, authorId, authorRole, trimmed.slice(0, 500))
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {sorted.length === 0 && <p className="cl-muted text-sm">No questions yet. Be the first to ask.</p>}
        {sorted.map((c) => (
          <div key={c.id} className="cl-card">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {c.authorRole === 'leadership' ? (
                  <span className="cl-ai-badge is-official">
                    <ShieldCheck size={12} /> Official City Response
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[var(--cl-text-dim)]">Resident</span>
                )}
              </div>
              <button className="cl-link" onClick={() => actions.flagComment(c.id)} aria-label="Flag comment">
                <Flag size={13} />
              </button>
            </div>
            <p className="text-sm">{c.message}</p>
            <div className="text-xs text-[var(--cl-text-faint)] mt-1">{formatTime(c.createdAt)}{c.flagged ? ' · Flagged' : ''}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder={authorRole === 'leadership' ? 'Reply as official city leadership…' : `Ask a question as ${authorLabel}…`}
          className="cl-input flex-1"
          maxLength={500}
        />
        <Button variant="primary" onClick={submit} icon={<Send size={15} />} aria-label="Send" />
      </div>
    </div>
  )
}
