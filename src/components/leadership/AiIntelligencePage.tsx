import { useState } from 'react'
import { Copy, Printer, RefreshCw, Sparkles } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { LensFace } from '../ui/Brand'
import { AiBadge } from '../shared/AiBadge'
import { PriorityPill } from '../shared/StatusPill'
import { useCivicStore } from '../../hooks/useCivicStore'
import { generateIntelligenceReport, type IntelligenceReport } from '../../lib/engine/aiReport'

const STEPS = [
  'Reviewing active community reports…',
  'Identifying recurring issues…',
  'Evaluating severity…',
  'Matching issues to municipal resources…',
  'Preparing recommendations…',
]

interface AiIntelligencePageProps {
  open: boolean
  onClose: () => void
  onOpenIssue: (issueId: string) => void
}

export function AiIntelligencePage({ open, onClose, onOpenIssue }: AiIntelligencePageProps) {
  const { state } = useCivicStore()
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [step, setStep] = useState(0)
  const [report, setReport] = useState<IntelligenceReport | null>(null)

  function generate() {
    setStatus('running')
    setStep(0)
    let i = 0
    const interval = setInterval(() => {
      i += 1
      if (i >= STEPS.length) {
        clearInterval(interval)
        setReport(generateIntelligenceReport(state))
        setStatus('done')
      } else {
        setStep(i)
      }
    }, 500)
  }

  function copyReport() {
    if (!report) return
    const text = report.findings.map((f) => `${f.title}\n${f.narrative}\n${f.recommendedResponse}`).join('\n\n')
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  return (
    <Sheet open={open} onClose={onClose} size="lg" poster title="AI Intelligence">
      <div className="cl-crate-ribbon is-ink"><span>Municipal Intelligence Report</span></div>

      {status === 'idle' && (
        <div className="text-center py-8 flex flex-col items-center">
          <LensFace size={72} />
          <h3 className="cl-crate-title mt-3">City Briefing</h3>
          <p className="cl-crate-sub max-w-md">LENS reads every issue currently reported in Fixity and drafts recommendations with rule-based logic. Nothing is invented.</p>
          <Button variant="primary" size="lg" className="mt-5" onClick={generate}><Sparkles size={16} /> Generate City Intelligence Report</Button>
        </div>
      )}

      {status === 'running' && (
        <div className="text-center py-12 flex flex-col items-center gap-3">
          <LensFace size={72} thinking />
          <p className="cl-display text-2xl font-extrabold">{STEPS[step]}</p>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i <= step ? 'var(--cl-ink)' : '#d9c79f' }} />
            ))}
          </div>
        </div>
      )}

      {status === 'done' && report && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <AiBadge label="Fixity Municipal Intelligence Report" />
              <h3 className="cl-crate-title mt-2">{report.cityName}</h3>
              <p className="cl-crate-sub flex items-center gap-2">Current priority: <PriorityPill priority={report.overallPriority} /> · {report.findings.length} active finding{report.findings.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={generate}><RefreshCw size={14} /> Regenerate</Button>
              <Button onClick={copyReport}><Copy size={14} /> Copy</Button>
              <Button onClick={() => window.print()}><Printer size={14} /> Export</Button>
            </div>
          </div>

          {report.findings.length === 0 && <p className="cl-muted">No active issues currently require escalation.</p>}

          <div className="grid gap-4 max-h-[55vh] overflow-y-auto p-1 pr-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
            {report.findings.map((f, idx) => {
              const issue = state.issues[f.issueId]
              return (
                <article key={f.issueId} className={`cl-decision ${issue?.priority === 'critical' ? 'is-critical' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h4>Finding {idx + 1}: {f.title}</h4>
                    {issue && <PriorityPill priority={issue.priority} />}
                  </div>
                  <span className="cl-label" style={{ fontSize: 11 }}>{f.category} · {f.reportCount} report{f.reportCount === 1 ? '' : 's'}</span>
                  <p>{f.narrative}</p>
                  <p><strong>Risk Assessment:</strong> {f.riskAssessment}</p>
                  <p><strong>Recommended Response:</strong> {f.recommendedResponse}</p>
                  <ul>{f.operationalSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  <p><strong>Suggested Department:</strong> {f.suggestedDepartment}</p>
                  <p style={{ color: '#4b5563' }}><strong>Suggested Communication:</strong> “{f.suggestedCommunication}”</p>
                  <button className="cl-link mt-2 self-start" onClick={() => { onOpenIssue(f.issueId); onClose() }}>Open referenced issue →</button>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </Sheet>
  )
}
