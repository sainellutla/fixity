import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, MapPin, RefreshCw } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { LensFace } from '../ui/Brand'
import { AiBadge } from '../shared/AiBadge'
import { PriorityPill, StatusPill } from '../shared/StatusPill'
import { useCivicStore } from '../../hooks/useCivicStore'
import { rankIssues, TIER_LABEL, type UrgencyTier } from '../../lib/engine/urgency'
import { CATEGORY_LABELS } from '../../lib/departments'
import { displayCode } from '../../lib/ids'

const TIERS: UrgencyTier[] = ['act_now', 'today', 'this_week', 'routine', 'closed']
const ANALYSIS_STEPS = ['Reading every open report…', 'Weighing hazard, corroboration and wait time…', 'Checking for vulnerable residents…', 'Ranking by urgency…']

interface UrgencyDashboardProps {
  open: boolean
  onClose: () => void
  onOpenIssue: (id: string) => void
  onOpenPlan: (id: string) => void
}

export function PriorityQueue({ open, onClose, onOpenIssue, onOpenPlan }: UrgencyDashboardProps) {
  const { state } = useCivicStore()
  const [filter, setFilter] = useState<UrgencyTier | 'all'>('all')
  const [analyzing, setAnalyzing] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  function runAnalysis() {
    setAnalyzing(1)
    let i = 1
    const t = setInterval(() => {
      i += 1
      if (i > ANALYSIS_STEPS.length) {
        clearInterval(t)
        setNow(Date.now())
        setAnalyzing(0)
      } else setAnalyzing(i)
    }, 420)
  }

  useEffect(() => {
    if (open) runAnalysis()
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [open])

  const ranked = useMemo(() => rankIssues(state, now), [state, now])
  const openRanked = ranked.filter((r) => r.urgency.tier !== 'closed')
  const counts = Object.fromEntries(TIERS.map((t) => [t, ranked.filter((r) => r.urgency.tier === t).length])) as Record<UrgencyTier, number>
  const visible = filter === 'all' ? openRanked : ranked.filter((r) => r.urgency.tier === filter)

  return (
    <Sheet open={open} onClose={onClose} size="xl" title="LENS Urgency Ranking">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="cl-advisor-head" style={{ maxWidth: 640 }}>
          <LensFace size={44} thinking={analyzing > 0} />
          <div>
            <AiBadge label="Demo AI ranking" />
            <p className="text-sm mt-1" style={{ color: 'var(--cl-text-dim)' }}>
              LENS scores every issue from 0–100 by weighing hazard severity, independent reports, time without a response, vulnerable residents, affected area, and failed fixes. The ranking doesn't just sort by priority label.
            </p>
          </div>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing > 0}><RefreshCw size={14} /> Re-run analysis</Button>
      </div>

      <div className="cl-tier-summary mt-4">
        <button className={`cl-tier ${filter === 'all' ? 'is-on' : ''}`} style={{ ['--t' as string]: 'var(--cl-paper)' }} onClick={() => setFilter('all')}>
          <b>{openRanked.length}</b><span>All open</span>
        </button>
        {TIERS.map((t) => (
          <button key={t} className={`cl-tier cl-tier-${t} ${filter === t ? 'is-on' : ''}`} onClick={() => setFilter(t)}>
            <b>{counts[t]}</b><span>{TIER_LABEL[t]}</span>
          </button>
        ))}
      </div>

      {analyzing > 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <LensFace size={64} thinking />
          <p className="cl-display text-2xl font-extrabold">{ANALYSIS_STEPS[analyzing - 1]}</p>
          <p className="text-sm" style={{ color: 'var(--cl-text-dim)' }}>Analyzing {ranked.length} issues across Manteca</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3 mt-4 max-h-[56vh] overflow-y-auto pr-1">
          {visible.length === 0 && <p className="cl-muted">No issues in this tier.</p>}
          {visible.map(({ issue, urgency }, idx) => {
            const rank = filter === 'all' ? idx + 1 : ranked.findIndex((r) => r.issue.id === issue.id) + 1
            return (
              <motion.li
                key={issue.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx, 8) * 0.05 }}
                className={`cl-rank-row cl-tier cl-tier-${urgency.tier} ${rank === 1 && urgency.tier !== 'closed' ? 'is-top' : ''}`}
              >
                <span className="cl-rank-num">#{rank}</span>
                <span className="cl-score" style={{ ['--s' as string]: urgency.score }} aria-label={`Urgency score ${urgency.score} of 100`}>
                  <b>{urgency.tier === 'closed' ? '✓' : urgency.score}</b>
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`cl-tier-chip cl-tier cl-tier-${urgency.tier}`}>{TIER_LABEL[urgency.tier]}</span>
                    <h3 className="text-xl" style={{ margin: 0 }}>{issue.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs" style={{ color: 'var(--cl-text-faint)' }}>
                    <span>{displayCode(issue.id)}</span>·<span>{CATEGORY_LABELS[issue.category]}</span>
                    <PriorityPill priority={issue.priority} />
                    <StatusPill status={issue.status} />
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--cl-paper)' }}>{urgency.rationale}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {urgency.factors.filter((f) => f.points !== 0).map((f) => (
                      <span key={f.label} className={`cl-factor ${f.points < 0 ? 'is-neg' : ''}`}>
                        <b>{f.points > 0 ? '+' : '−'}{Math.abs(f.points)}</b> {f.label}
                      </span>
                    ))}
                    <span className="cl-factor">Confidence: {urgency.confidence}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" onClick={() => onOpenPlan(issue.id)}><ClipboardList size={15} /> Action Plan</Button>
                  <Button onClick={() => { onOpenIssue(issue.id); onClose() }}><MapPin size={15} /> View on map</Button>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}
    </Sheet>
  )
}
