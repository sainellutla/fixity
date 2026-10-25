import { departmentForCategory } from '../departments'
import { languageLabel } from '../voiceScripts'
import type { CivicState, Issue } from '../types'
import { assessUrgency, TIER_LABEL, type UrgencyTier } from './urgency'

export type PlanAction =
  | { kind: 'acknowledge' }
  | { kind: 'assign'; departmentId: string }
  | { kind: 'in_progress' }
  | { kind: 'publish'; title: string; message: string }
  | { kind: 'resolve' }

export interface PlanStep {
  id: string
  title: string
  detail: string
  owner: string
  action?: PlanAction
  /** Already satisfied by the issue's current state (e.g. it's been acknowledged). */
  autoDone: boolean
}

export interface PlanPhase {
  id: 'now' | 'field' | 'close'
  label: string
  window: string
  steps: PlanStep[]
}

export interface ActionPlan {
  issueId: string
  headline: string
  summary: string
  tier: UrgencyTier
  department: string
  phases: PlanPhase[]
}

interface Playbook {
  immediate: Omit<PlanStep, 'autoDone' | 'owner'>[]
  field: Omit<PlanStep, 'autoDone' | 'owner'>[]
}

const PLAYBOOKS: Record<string, Playbook> = {
  signal: {
    immediate: [
      { id: 'verify-signal', title: 'Verify the signal on site', detail: 'Send a technician to confirm whether the signal is dark, flashing, or stuck. Drivers must treat a dark signal as an all-way stop.' },
      { id: 'traffic-control', title: 'Arrange temporary traffic control', detail: 'If the intersection is busy, request officers or trained staff to direct traffic, or place portable stop signs until it is repaired.' },
    ],
    field: [
      { id: 'repair-controller', title: 'Diagnose and repair the controller', detail: 'Check power, the controller cabinet, and signal heads. Replace failed components.' },
      { id: 'test-phases', title: 'Test every signal phase', detail: 'Cycle all directions, including pedestrian signals, before removing temporary control.' },
    ],
  },
  road: {
    immediate: [
      { id: 'mark-hazard', title: 'Mark the hazard', detail: 'Place cones or a warning sign so drivers can see and avoid it.' },
    ],
    field: [
      { id: 'temp-patch', title: 'Apply a temporary patch', detail: 'Fill with cold-mix asphalt to make the lane safe right away.' },
      { id: 'perm-repair', title: 'Schedule a permanent repair', detail: 'Add a hot-mix repair to the next paving schedule and inspect the surrounding pavement.' },
    ],
  },
  sinkhole: {
    immediate: [
      { id: 'close-lane', title: 'Close the affected lane', detail: 'Barricade the area. Do not let traffic pass over it until it has been inspected.' },
    ],
    field: [
      { id: 'inspect-void', title: 'Inspect for underground voids', detail: 'Check nearby water and sewer lines; a sinkhole often points to a leak below.' },
      { id: 'perm-repair', title: 'Repair the subgrade and pavement', detail: 'Fix the underlying cause first, then repave.' },
    ],
  },
  lighting: {
    immediate: [
      { id: 'confirm-fixture', title: 'Confirm which fixture is out', detail: 'Identify the pole number so the crew brings the right parts.' },
    ],
    field: [
      { id: 'replace-lamp', title: 'Replace the lamp or check the circuit', detail: 'If the lamp is fine, test the photocell and the circuit feeding the pole.' },
      { id: 'check-neighbors', title: 'Check neighboring lights', detail: 'Lights on the same circuit often fail together. Check the whole block.' },
    ],
  },
  flooding: {
    immediate: [
      { id: 'warn-drivers', title: 'Warn drivers away', detail: 'Place "Road Flooded" signs and close the road if the water is too deep to cross safely.' },
    ],
    field: [
      { id: 'clear-drains', title: 'Clear storm drains and inlets', detail: 'Remove debris blocking drains, the most common cause of street flooding.' },
      { id: 'check-pumps', title: 'Check whether pumps are needed', detail: 'If water is not draining, bring in portable pumps.' },
      { id: 'post-flood', title: 'Inspect the road after the water recedes', detail: 'Flooding can undermine pavement. Look for new potholes or soft spots.' },
    ],
  },
  sidewalk: {
    immediate: [
      { id: 'assess-access', title: 'Assess accessibility impact', detail: 'Confirm whether wheelchair and stroller users are being forced into the street.' },
    ],
    field: [
      { id: 'clear-path', title: 'Clear the obstruction', detail: 'Remove it, or notify the property owner if it comes from private landscaping.' },
      { id: 'confirm-width', title: 'Confirm an accessible path', detail: 'Leave a continuous clear path at least 36 inches wide.' },
    ],
  },
  congestion: {
    immediate: [
      { id: 'review-timing', title: 'Review signal timing and traffic data', detail: 'Compare current timing plans with peak-hour volumes on the corridor.' },
    ],
    field: [
      { id: 'observe-peak', title: 'Observe peak-hour traffic on site', detail: 'Watch where the backup starts and which movement causes it.' },
      { id: 'adjust-timing', title: 'Adjust timing or propose a traffic study', detail: 'Retime the signals, or bring a study recommendation to council if the fix needs design changes.' },
    ],
  },
  electrical: {
    immediate: [
      { id: 'keep-clear', title: 'Keep people away and call the utility', detail: 'Cordon off the area and contact the electric utility. Only qualified crews should approach.' },
    ],
    field: [
      { id: 'make-safe', title: 'Make the equipment safe', detail: 'The utility or licensed electricians de-energize and secure the hazard.' },
      { id: 'restore', title: 'Restore service and inspect', detail: 'Confirm nearby equipment was not damaged.' },
    ],
  },
  parks: {
    immediate: [
      { id: 'tape-off', title: 'Tape off damaged equipment', detail: 'Keep kids off anything unsafe until it is repaired.' },
    ],
    field: [
      { id: 'repair-park', title: 'Repair or replace the equipment', detail: 'Order parts if needed and log the repair for the next inspection.' },
    ],
  },
  sanitation: {
    immediate: [
      { id: 'confirm-route', title: 'Confirm the route and pickup schedule', detail: 'Check whether the route was missed or the bins were not set out.' },
    ],
    field: [
      { id: 'makeup-pickup', title: 'Send a make-up pickup', detail: 'Collect the missed bins and note it on the route record.' },
    ],
  },
  generic: {
    immediate: [
      { id: 'inspect', title: 'Inspect the reported location', detail: 'Confirm the problem and how many people it affects.' },
    ],
    field: [
      { id: 'resolve-work', title: 'Fix it or route it to the right team', detail: 'Complete the repair, or hand it off with notes if another department owns it.' },
    ],
  },
}

function playbookKey(issue: Issue): string {
  const t = issue.aiAnalysis.issueType
  if (t === 'Traffic Signal Malfunction') return 'signal'
  if (t === 'Electrical Hazard') return 'electrical'
  if (t === 'Severe Flooding' || issue.category === 'water_drainage') return 'flooding'
  if (t === 'Roadway Hazard') return 'sinkhole'
  if (t === 'Recurring Traffic Congestion') return 'congestion'
  if (t === 'Missing or Downed Traffic Sign' || t === 'Road Obstruction') return 'road'
  switch (issue.category) {
    case 'road_damage': return 'road'
    case 'public_lighting': return 'lighting'
    case 'sidewalk_accessibility': return 'sidewalk'
    case 'traffic_safety': return 'congestion'
    case 'public_parks': return 'parks'
    case 'waste_sanitation': return 'sanitation'
    default: return 'generic'
  }
}

const WINDOWS: Record<UrgencyTier, [string, string, string]> = {
  act_now: ['First hour', 'Today', 'Before closing it out'],
  today: ['Within 4 hours', 'Next 24 hours', 'This week'],
  this_week: ['Within 1 business day', 'This week', 'Close-out'],
  routine: ['This week', 'Next maintenance cycle', 'Close-out'],
  closed: ['Review', 'If reopened', 'Close-out'],
}

/** LENS action plan (demo, rule-based): a phased playbook adapted to this issue's situation. */
export function buildActionPlan(issue: Issue, state: CivicState): ActionPlan {
  const urgency = assessUrgency(issue, state)
  const department = departmentForCategory(issue.category)
  const playbook = PLAYBOOKS[playbookKey(issue)]
  const reports = issue.reportIds.map((id) => state.reports[id]).filter(Boolean)
  const updates = Object.values(state.updates).filter((u) => u.issueId === issue.id)
  const comments = Object.values(state.comments).filter((c) => c.issueId === issue.id).sort((a, b) => a.createdAt - b.createdAt)
  const lastOfficial = [...comments].reverse().find((c) => c.authorRole === 'leadership')?.createdAt ?? 0
  const unanswered = comments.filter((c) => c.authorRole === 'resident' && c.createdAt > lastOfficial).length
  const spoken = [...new Set(reports.map((r) => r.spokenLanguage).filter((l) => l && l !== 'en'))] as NonNullable<(typeof reports)[number]['spokenLanguage']>[]

  const status = issue.status
  const pastReported = status !== 'reported'
  const inProgressOrLater = status === 'in_progress' || status === 'resolved' || status === 'community_verified'
  const closed = status === 'resolved' || status === 'community_verified'
  const [w1, w2, w3] = WINDOWS[urgency.tier]

  const now: PlanStep[] = []
  if (issue.followUpRequested || status === 'reopened') {
    now.push({ id: 'reinspect', title: 'Re-inspect: a resident says it is still broken', detail: 'Check what the earlier fix missed before sending the crew back.', owner: department.name, autoDone: false })
  }
  now.push({
    id: 'acknowledge',
    title: 'Acknowledge the report publicly',
    detail: 'Let residents know the city has seen it. This stops duplicate reports and builds trust.',
    owner: 'Operations Center',
    action: { kind: 'acknowledge' },
    autoDone: pastReported,
  })
  now.push({
    id: 'assign',
    title: `Assign to ${department.name}`,
    detail: department.description,
    owner: 'Operations Center',
    action: { kind: 'assign', departmentId: department.id },
    autoDone: issue.assignedDepartment === department.id,
  })
  for (const s of playbook.immediate) now.push({ ...s, owner: department.name, autoDone: closed })

  const field: PlanStep[] = [
    { id: 'in-progress', title: 'Mark the issue In Progress', detail: 'Once a crew is confirmed, flip the status so residents can see work has started.', owner: 'Operations Center', action: { kind: 'in_progress' }, autoDone: inProgressOrLater },
  ]
  if (issue.affectedArea.mode === 'area' && issue.affectedArea.radiusMeters) {
    field.push({ id: 'survey-area', title: `Survey the full ~${issue.affectedArea.radiusMeters}m area`, detail: 'Residents reported a whole area, not one spot. Walk the full zone so nothing is missed.', owner: department.name, autoDone: false })
  }
  for (const s of playbook.field) field.push({ ...s, owner: department.name, autoDone: closed })
  field.push({
    id: 'publish',
    title: 'Publish an official update',
    detail: 'Tell residents what is being done. Promise only timelines you can keep.',
    owner: 'Communications Office',
    action: {
      kind: 'publish',
      title: `${issue.aiAnalysis.issueType} — City Response`,
      message: `We're aware of the reported ${issue.aiAnalysis.issueType.toLowerCase()} ("${issue.title}"). ${department.name} has been assigned and is prioritizing an inspection. We'll post another update here as work progresses.`,
    },
    autoDone: updates.length > 0,
  })

  const close: PlanStep[] = []
  if (reports.length > 1 || unanswered > 0 || spoken.length > 0) {
    const parts = [
      reports.length > 1 ? `${reports.length} residents reported this` : null,
      unanswered > 0 ? `${unanswered} question${unanswered === 1 ? '' : 's'} waiting for a reply` : null,
      spoken.length ? `reply in ${spoken.map(languageLabel).join(' and ')} — the reporter spoke it` : null,
    ].filter(Boolean)
    close.push({ id: 'reply-residents', title: 'Answer residents directly', detail: `${parts.join('; ')}.`, owner: 'Communications Office', autoDone: unanswered === 0 && comments.some((c) => c.authorRole === 'leadership') })
  }
  close.push({ id: 'resolve', title: 'Mark resolved after the fix is confirmed', detail: 'Only close it once the crew confirms the repair on site.', owner: 'Operations Center', action: { kind: 'resolve' }, autoDone: closed })
  close.push({ id: 'verify', title: 'Ask residents to verify the fix', detail: 'Fixity asks reporters to confirm. Watch for "still broken" replies.', owner: 'Operations Center', autoDone: status === 'community_verified' })

  const phases: PlanPhase[] = [
    { id: 'now', label: 'Respond', window: w1, steps: now },
    { id: 'field', label: 'Fix', window: w2, steps: field },
    { id: 'close', label: 'Close the loop', window: w3, steps: close },
  ]

  const total = phases.reduce((n, p) => n + p.steps.length, 0)
  return {
    issueId: issue.id,
    headline: `${TIER_LABEL[urgency.tier]} · ${issue.aiAnalysis.issueType}`,
    summary: `${total} steps in 3 phases, led by ${department.name}. ${urgency.rationale}`,
    tier: urgency.tier,
    department: department.name,
    phases,
  }
}
