import type { ReactNode } from 'react'
import { AnimatedNumber } from './AnimatedNumber'

export function Meter({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <span className="cl-meter" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${pct}%`, ['--c' as string]: color }} />
    </span>
  )
}

interface GaugeProps {
  icon: ReactNode
  value: number
  label: string
  color: string
  meter: number
  danger?: boolean
  onClick?: () => void
}

export function Gauge({ icon, value, label, color, meter, danger, onClick }: GaugeProps) {
  return (
    <button type="button" className={`cl-gauge ${danger ? 'is-danger' : ''}`} style={{ ['--c' as string]: color }} onClick={onClick} aria-label={`${label}: ${value}`}>
      <span className="cl-gauge-icon">{icon}</span>
      <span className="cl-gauge-body">
        <span className="cl-gauge-value"><AnimatedNumber value={value} /></span>
        <span className="cl-gauge-label">{label}</span>
      </span>
      <Meter value={meter} color={color} />
    </button>
  )
}
