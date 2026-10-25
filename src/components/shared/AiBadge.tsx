import { Sparkles } from 'lucide-react'

export function AiBadge({ label = 'Demo AI Analysis' }: { label?: string }) {
  return (
    <span className="cl-ai-badge">
      <Sparkles size={12} />
      {label}
    </span>
  )
}
