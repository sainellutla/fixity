import { useEffect, useMemo, useState } from 'react'
import { Check, ClipboardList, Copy, Play } from 'lucide-react'
import { useCivicStore } from '../../hooks/useCivicStore'
import { buildActionPlan, type PlanAction, type PlanStep } from '../../lib/engine/actionPlan'
import { assessUrgency, TIER_LABEL } from '../../lib/engine/urgency'
import { displayCode } from '../../lib/ids'
import type { Issue } from '../../lib/types'
import { AiBadge } from '../shared/AiBadge'
import { PriorityPill, StatusPill } from '../shared/StatusPill'
import { LensFace } from '../ui/Brand'
import { Button } from '../ui/Button'
import { Meter } from '../ui/Gauge'
import { Sheet } from '../ui/Sheet'
import { PublishResponsePanel } from './PublishResponsePanel'

const DRAFT_STEPS = ['Reading resident reports…', 'Matching the responsible department…', 'Choosing the right playbook…', 'Sequencing the steps…']

const ACTION_LABEL: Record<PlanAction['kind'], string> = {
  acknowledge: 'Acknowledge now',
  assign: 'Assign now',
  in_progress: 'Mark in progress',
  publish: 'Draft the update',
  resolve: 'Mark resolved',
}

interface ActionPlanSheetProps {
  issue: Issue | null
  onClose: () => void
}

export function ActionPlanSheet({ issue, onClose }: ActionPlanSheetProps) {
  const { state, actions } = useCivicStore()
  const [drafting, setDrafting] = useState(0)
  const [publishPrefill, setPublishPrefill] = useState<{ title: string; message: string; departmentId?: string } | null>(null)

  const issueId = issue?.id
  useEffect(() => {
    if (!issueId) return
    setDrafting(1)
    let i = 1
    const t = setInterval(() => {
      i += 1
      if (i > DRAFT_STEPS.length) {
        clearInterval(t)
        setDrafting(0)
      } else {
        setDrafting(i)
      }
    }, 450)
    return () => clearInterval(t)
  }, [issueId])

  const plan = useMemo(() => (issue ? buildActionPlan(issue, state) : null), [issue, state])
  const urgency = useMemo(() => (issue ? assessUrgency(issue, state) : null), [issue, state])
  if (!issue || !plan || !urgency) return null

  const isDone = (step: PlanStep) => step.autoDone || Boolean(state.planSteps?.[`${issue.id}:${step.id}`]?.done)
  const allSteps = plan.phases.flatMap((p) => p.steps)
  const doneCount = allSteps.filter(isDone).length
  const next = allSteps.find((s) => !isDone(s))

  function run(step: PlanStep) {
    if (!issue || !step.action) return
    const a = step.action
    switch (a.kind) {
      case 'acknowledge':
        actions.setStatus(issue.id, 'acknowledged', 'Acknowledged', 'City leadership reviewed the report.')
        break
      case 'assign':
        actions.assignDepartment(issue.id, a.departmentId)
        break
      case 'in_progress':
        actions.setStatus(issue.id, 'in_progress', 'In Progress', 'City leadership marked this in progress.')
        break
      case 'publish':
        setPublishPrefill({ title: a.title, message: a.message, departmentId: issue.assignedDepartment ?? undefined })
        return
      case 'resolve':
        actions.setStatus(issue.id, 'resolved', 'Resolved', 'City leadership marked this issue resolved.')
        break
    }
    actions.setPlanStep(issue.id, step.id, true)
  }

  function copyPlan() {
    if (!plan || !issue) return
    const text = [`LENS Action Plan — ${issue.title} (${displayCode(issue.id)})`, plan.summary, '']
      .concat(plan.phases.flatMap((p) => [`${p.label} · ${p.window}`, ...p.steps.map((s, i) => `  ${isDone(s) ? '[x]' : '[ ]'} ${i + 1}. ${s.title} — ${s.owner}`)]))
      .join('\n')
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  let stepNumber = 0

  return (
    <>
      <Sheet open onClose={onClose} size="xl" poster title="LENS Action Plan">
        <div className="cl-crate-ribbon is-ink"><span>LENS Action Plan</span></div>

        {drafting > 0 ? (
          <div className="text-center py-14 flex flex-col items-center gap-3">
            <LensFace size={72} thinking />
            <p className="cl-display text-2xl font-extrabold">{DRAFT_STEPS[drafting - 1]}</p>
            <p className="cl-crate-sub">Drafting a step-by-step plan for “{issue.title}”.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <AiBadge />
                  <span className={`cl-tier-chip cl-tier cl-tier-${urgency.tier}`}>{TIER_LABEL[urgency.tier]} · urgency {urgency.score}</span>
                </div>
                <h3 className="cl-crate-title mt-2" style={{ fontSize: 34 }}>{issue.title}</h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="cl-label" style={{ color: '#6b5a3a' }}>{displayCode(issue.id)}</span>
                  <PriorityPill priority={issue.priority} />
                  <StatusPill status={issue.status} />
                  <span className="text-sm" style={{ color: '#4b5563' }}>Lead: <strong>{plan.department}</strong></span>
                </div>
              </div>
              <div style={{ minWidth: 220 }}>
                <div className="flex justify-between text-sm font-bold"><span>Progress</span><span>{doneCount} / {allSteps.length} steps</span></div>
                <div className="mt-1"><Meter value={(doneCount / allSteps.length) * 100} color="#3d8b4a" /></div>
                <div className="flex gap-2 mt-3 justify-end">
                  <Button onClick={copyPlan}><Copy size={14} /> Copy plan</Button>
                </div>
              </div>
            </div>

            <div className="cl-crate-note" style={{ marginTop: 0 }}>
              <LensFace size={36} />
              <p>
                <em>{plan.summary}</em>
                {next && <><br /><strong>Next step:</strong> {next.title}.</>}
                {!next && <><br /><strong>Every step is done.</strong> Watch for residents confirming the fix.</>}
              </p>
            </div>

            <div className="cl-plan-phases max-h-[52vh] overflow-y-auto p-2">
              {plan.phases.map((phase) => (
                <section key={phase.id}>
                  <div className="cl-plan-phase-head">
                    <h4>{phase.label}</h4>
                    <span className="cl-label" style={{ color: '#6b5a3a' }}>{phase.window}</span>
                  </div>
                  {phase.steps.map((step) => {
                    stepNumber += 1
                    const done = isDone(step)
                    return (
                      <article key={step.id} className={`cl-plan-step ${done ? 'is-done' : ''}`}>
                        <span className="cl-plan-num">{stepNumber}</span>
                        <button
                          className={`cl-plan-check ${done ? 'is-on' : ''}`}
                          disabled={step.autoDone}
                          onClick={() => actions.setPlanStep(issue.id, step.id, !done)}
                          aria-label={done ? `Mark "${step.title}" not done` : `Mark "${step.title}" done`}
                          title={step.autoDone ? 'Completed in Fixity' : undefined}
                        >
                          {done && <Check size={15} strokeWidth={3} />}
                        </button>
                        <div className="min-w-0">
                          <div className="cl-plan-title">{step.title}</div>
                          <p className="cl-plan-detail">{step.detail}</p>
                          <span className="cl-plan-owner">{step.owner}</span>
                          {step.autoDone ? (
                            <div><span className="cl-plan-auto"><Check size={12} /> Done in Fixity</span></div>
                          ) : step.action && !done ? (
                            <div><button className="cl-plan-do" onClick={() => run(step)}><Play size={12} fill="currentColor" /> {ACTION_LABEL[step.action.kind]}</button></div>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </section>
              ))}
            </div>

            <p className="cl-fineprint flex items-center gap-1">
              <ClipboardList size={12} /> Generated by LENS rule-based playbooks for this demo. It does not dispatch crews or confirm contractor availability. Qualified staff make the final call.
            </p>
          </div>
        )}
      </Sheet>

      <PublishResponsePanel
        key={publishPrefill ? publishPrefill.title : 'closed'}
        open={publishPrefill !== null}
        onClose={() => setPublishPrefill(null)}
        issue={issue}
        prefill={publishPrefill}
        onPublish={(input) => {
          actions.publishUpdate(issue.id, { ...input, author: 'City Leadership Demo Portal' })
          actions.setPlanStep(issue.id, 'publish', true)
          setPublishPrefill(null)
        }}
      />
    </>
  )
}
