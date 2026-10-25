import type { TimelineEvent } from '../../lib/types'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => a.createdAt - b.createdAt)
  return (
    <ol className="flex flex-col gap-3">
      {sorted.map((event, i) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className="w-2.5 h-2.5 rounded-full mt-1.5"
              style={{ background: i === sorted.length - 1 ? 'var(--cl-accent)' : 'var(--cl-text-dim)' }}
            />
            {i < sorted.length - 1 && <span className="flex-1 w-px bg-white/10 my-1" />}
          </div>
          <div className="pb-3">
            <div className="text-sm font-semibold">{event.label}</div>
            <div className="text-sm text-[var(--cl-text-dim)]">{event.description}</div>
            <div className="text-xs text-[var(--cl-text-faint)] mt-0.5">{formatTime(event.createdAt)}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
