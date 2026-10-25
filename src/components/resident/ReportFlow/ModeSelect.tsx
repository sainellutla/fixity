import { MapPin, Shapes } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'

interface ModeSelectProps {
  open: boolean
  onClose: () => void
  onChoose: (mode: 'point' | 'area') => void
}

export function ModeSelect({ open, onClose, onChoose }: ModeSelectProps) {
  return (
    <Sheet open={open} onClose={onClose} size="sm" title="Report an Issue">
      <p className="cl-muted">How does this issue affect your neighborhood?</p>
      <div className="grid grid-cols-1 gap-3 mt-2">
        <button className="cl-card text-left p-4 hover:-translate-y-0.5 transition-transform" onClick={() => onChoose('point')}>
          <MapPin size={20} style={{ color: 'var(--cl-accent)' }} />
          <div className="font-bold mt-1">A single spot</div>
          <p className="text-sm cl-muted">A broken signal, pothole, or specific hazard. Click one point on the map.</p>
        </button>
        <button className="cl-card text-left p-4 hover:-translate-y-0.5 transition-transform" onClick={() => onChoose('area')}>
          <Shapes size={20} style={{ color: 'var(--cl-accent)' }} />
          <div className="font-bold mt-1">A wider area</div>
          <p className="text-sm cl-muted">Flooding, unsafe sidewalks, or an issue across several blocks. Drag to draw the affected area.</p>
        </button>
      </div>
    </Sheet>
  )
}
