import { useState } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import { Button } from '../ui/Button'

export function DemoResetButton() {
  const { actions } = useCivicStore()
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="cl-card is-alert">
        <div className="flex items-center gap-2 text-sm font-semibold"><TriangleAlert size={16} style={{ color: 'var(--cl-critical)' }} /> Reset demo data?</div>
        <p className="text-sm cl-muted mt-1">This clears all reports, comments, and updates created during this session and restores the original seed issues.</p>
        <div className="flex gap-2 mt-3">
          <Button variant="alert" onClick={() => { actions.resetDemo(); setConfirming(false) }}>Confirm Reset</Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <Button variant="soft" onClick={() => setConfirming(true)}>
      <RotateCcw size={15} /> Demo Reset
    </Button>
  )
}
