import { Sheet } from '../ui/Sheet'
import { CATEGORY_LABELS, DEPARTMENTS } from '../../lib/departments'

export function ResourceDirectoryPage({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} size="md" title="Resource Directory">
      <p className="cl-muted mb-3">Demo directory — not connected to any real municipal system.</p>
      <div className="flex flex-col gap-2">
        {DEPARTMENTS.map((d) => (
          <div key={d.id} className="cl-card">
            <div className="font-bold">{d.name}</div>
            <p className="text-sm cl-muted mt-1">{d.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {d.supportedCategories.map((c) => (
                <span key={c} className="cl-chip"><i /> {CATEGORY_LABELS[c]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
