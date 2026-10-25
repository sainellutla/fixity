export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="1.5" y="1.5" width="37" height="37" rx="7" fill="#f2b544" />
      <rect x="4.5" y="4.5" width="31" height="31" rx="5" fill="none" stroke="#13233a" strokeWidth="1.4" />
      <circle cx="18" cy="17" r="8" fill="#fbefd5" stroke="#13233a" strokeWidth="2.4" />
      <path d="M18 12.5c-2.4 0-4.2 1.8-4.2 4.1 0 3 4.2 6.6 4.2 6.6s4.2-3.6 4.2-6.6c0-2.3-1.8-4.1-4.2-4.1Z" fill="#e5583a" stroke="#13233a" strokeWidth="1.2" />
      <circle cx="18" cy="16.6" r="1.5" fill="#fbefd5" />
      <path d="M24 23l7 7" stroke="#13233a" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  )
}

/** LENS — Fixity's advisor mascot, drawn in the same flat crate-label style as ValleyVerse's VAL. */
export function LensFace({ size = 40, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={`cl-face ${thinking ? 'is-thinking' : ''}`} style={{ flexShrink: 0 }}>
      <circle cx="24" cy="26" r="17" fill="#49b4d6" />
      <circle cx="24" cy="26" r="17" fill="none" stroke="#13233a" strokeWidth="2" />
      <path d="M24 9V5" stroke="#13233a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="4.5" r="2.6" fill="#f2b544" stroke="#13233a" strokeWidth="1.4" />
      <rect x="12" y="19" width="24" height="12" rx="6" fill="#13233a" />
      <circle className="cl-face-eye" cx="19" cy="25" r="2.6" fill="#ffcb62" />
      <circle className="cl-face-eye" cx="29" cy="25" r="2.6" fill="#ffcb62" />
      <path d="M19 35q5 3.5 10 0" fill="none" stroke="#13233a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
