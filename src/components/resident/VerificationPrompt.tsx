import { useState } from 'react'
import { useCivicStore } from '../../hooks/useCivicStore'
import { useCurrentResident } from '../../hooks/useCurrentResident'
import { Button } from '../ui/Button'

export function VerificationPrompt({ issueId }: { issueId: string }) {
  const { actions } = useCivicStore()
  const { residentId } = useCurrentResident()
  const [submitted, setSubmitted] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  if (submitted) {
    return <p className="cl-muted text-sm">Thanks — your feedback has been recorded.</p>
  }

  function respond(verified: 'yes' | 'no' | 'unsure') {
    if (verified === 'no') {
      setShowNote(true)
      return
    }
    actions.submitVerification(issueId, residentId, verified)
    setSubmitted(true)
  }

  return (
    <div className="cl-card is-gold">
      <p className="text-sm font-semibold">Has this problem actually been resolved?</p>
      {!showNote ? (
        <div className="flex gap-2 mt-2">
          <Button size="default" onClick={() => respond('yes')}>Yes, it's fixed</Button>
          <Button size="default" onClick={() => respond('no')}>No, still there</Button>
          <Button size="default" variant="ghost" onClick={() => respond('unsure')}>Not sure</Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you notice?"
            rows={2}
            className="cl-input resize-none"
          />
          <Button
            variant="alert"
            onClick={() => { actions.submitVerification(issueId, residentId, 'no', note.trim() || undefined); setSubmitted(true) }}
          >
            Submit Follow-up
          </Button>
        </div>
      )}
    </div>
  )
}
