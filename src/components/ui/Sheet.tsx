import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type SheetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface SheetProps {
  open: boolean
  onClose: () => void
  size?: SheetSize
  title?: string
  /** Renders as a cream "crate-label" poster instead of a dark sheet. */
  poster?: boolean
  children: ReactNode
}

// Open sheets, topmost last — Escape closes only the top one when sheets are stacked.
const openStack: symbol[] = []

export function Sheet({ open, onClose, size = 'sm', title, poster, children }: SheetProps) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const id = Symbol('sheet')
    openStack.push(id)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) {
        e.stopImmediatePropagation()
        onCloseRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      openStack.splice(openStack.indexOf(id), 1)
    }
  }, [open])

  if (!open) return null

  const close = (
    <button className="cl-close" onClick={onClose} aria-label="Close">
      <X size={18} />
    </button>
  )

  return (
    <div className="civic-app cl-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`cl-sheet cl-sheet-${size} ${poster ? 'is-poster' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        {poster ? (
          <div className="cl-crate">
            {close}
            {children}
          </div>
        ) : (
          <>
            {close}
            {title && <span className="cl-sheet-title">{title}</span>}
            {children}
          </>
        )}
      </div>
    </div>
  )
}
