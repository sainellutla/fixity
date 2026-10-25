import { Sheet } from '../ui/Sheet'
import { DemoResetButton } from '../shared/DemoResetButton'

export function DemoSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} size="sm" title="Demo Settings">
      <p className="cl-muted">Fixity is a hackathon demonstration. No real government systems, authentication, or AI services are connected.</p>
      <div className="mt-3">
        <DemoResetButton />
      </div>
    </Sheet>
  )
}
