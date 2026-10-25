import { useState } from 'react'
import { ChevronDown, UserRound } from 'lucide-react'
import { RESIDENTS, useCurrentResident } from '../../hooks/useCurrentResident'

export function IdentitySwitcher() {
  const { resident, switchResident } = useCurrentResident()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="cl-btn full justify-between"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'rgba(255,255,255,.04)' }}
      >
        <span className="flex items-center gap-2">
          <UserRound size={16} /> {resident.name}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 cl-card z-30" style={{ background: 'var(--cl-surface-2)' }}>
          {RESIDENTS.map((r) => (
            <button
              key={r.id}
              className="w-full text-left px-2 py-2 rounded-md hover:bg-white/5 text-sm"
              onClick={() => { switchResident(r.id); setOpen(false) }}
              style={{ color: r.id === resident.id ? 'var(--cl-accent-2)' : undefined, fontWeight: r.id === resident.id ? 700 : 400 }}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
