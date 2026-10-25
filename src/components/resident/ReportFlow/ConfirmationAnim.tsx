import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Trophy } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { Button } from '../../ui/Button'
import { LensFace } from '../../ui/Brand'
import { AiBadge } from '../../shared/AiBadge'
import { PriorityPill, PRIORITY_LABEL } from '../../shared/StatusPill'
import { displayCode } from '../../../lib/ids'
import { POINTS } from '../../../lib/engine/points'
import type { AiAnalysis } from '../../../lib/types'

interface ConfirmationAnimProps {
  open: boolean
  issueId: string | null
  analysis: AiAnalysis | null
  isNew: boolean
  onDone: () => void
}

const STAMP_COLOR: Record<AiAnalysis['classification'], string> = {
  critical: '#e5583a',
  high: '#d9731f',
  medium: '#b9842a',
  low: '#6b7280',
}

export function ConfirmationAnim({ open, issueId, analysis, isNew, onDone }: ConfirmationAnimProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (!open) {
      setStage(0)
      return
    }
    const t1 = setTimeout(() => setStage(1), 1100)
    const t2 = setTimeout(() => setStage(2), 2600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [open])

  if (!open || !issueId) return null

  const earned = POINTS.report + (isNew ? POINTS.firstSpot : POINTS.confirm)

  return (
    <Sheet open={open} onClose={onDone} size="sm" poster title="Report submitted">
      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center gap-2 py-4">
            <div className="cl-crate-ribbon is-good"><span>Report Filed</span></div>
            <CheckCircle2 size={44} style={{ color: '#3d8b4a' }} />
            <h3 className="cl-crate-title" style={{ fontSize: 34 }}>Your voice has been heard.</h3>
            <p className="cl-crate-sub">Report {displayCode(issueId)} successfully submitted.</p>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center gap-3 py-10">
            <LensFace size={64} thinking />
            <p className="cl-display text-2xl font-extrabold">Analyzing community impact…</p>
            <p className="cl-crate-sub">LENS is checking nearby reports and city departments.</p>
          </motion.div>
        )}

        {stage === 2 && analysis && (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="cl-crate-ribbon is-ink"><span>{isNew ? 'New Issue Detected' : 'Report Grouped'}</span></div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <AiBadge />
                <h3 className="cl-crate-title mt-2" style={{ fontSize: 30 }}>Priority classification complete.</h3>
                <div className="mt-2"><PriorityPill priority={analysis.classification} /></div>
              </div>
              <span className="cl-stamp mt-2" style={{ ['--stamp' as string]: STAMP_COLOR[analysis.classification] }}>
                {PRIORITY_LABEL[analysis.classification]}
              </span>
            </div>

            <dl className="cl-crate-grid">
              <div><dt>Issue Type</dt><dd>{analysis.issueType}</dd></div>
              <div><dt>Confidence</dt><dd>{analysis.confidence}</dd></div>
              <div><dt>Suggested Department</dt><dd>{analysis.suggestedDepartment}</dd></div>
              <div><dt>Recommended Action</dt><dd>{analysis.recommendedAction}</dd></div>
            </dl>

            <div className="cl-crate-note">
              <LensFace size={34} />
              <p><em>{analysis.reasoning}</em></p>
            </div>

            {!isNew && <p className="cl-fineprint">This report was grouped with an existing community issue.</p>}

            <div className="flex items-center justify-between gap-3 mt-4">
              <span className="cl-chip" style={{ background: '#efe2c1', borderColor: '#d9c79f', color: 'var(--cl-ink)', fontSize: 14 }}>
                <Trophy size={14} style={{ color: '#b9842a' }} /> +{earned} civic points
              </span>
              <Button variant="primary" size="lg" onClick={onDone}>View on Map</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
