import type { CivicState, Issue, ResidentReport } from '../types'

export type UrgencyTier = 'act_now' | 'today' | 'this_week' | 'routine' | 'closed'

export interface UrgencyFactor {
  label: string
  points: number
}

export interface UrgencyAssessment {
  issueId: string
  score: number
  tier: UrgencyTier
  factors: UrgencyFactor[]
  rationale: string
  confidence: 'High' | 'Medium' | 'Low'
}

export const TIER_LABEL: Record<UrgencyTier, string> = {
  act_now: 'Act now',
  today: 'Today',
  this_week: 'This week',
  routine: 'Routine',
  closed: 'Closed',
}

const HAZARD_POINTS: Record<Issue['priority'], number> = { critical: 64, high: 38, medium: 22, low: 10 }
const ROADWAY_CATEGORIES: Issue['category'][] = ['traffic_safety', 'road_damage', 'water_drainage']
const HAZARD_LABEL: Record<Issue['priority'], string> = {
  critical: 'Immediate safety hazard',
  high: 'Significant safety risk',
  medium: 'Moderate impact',
  low: 'Cosmetic / quality of life',
}

const VULNERABLE_CUES: { words: string[]; label: string }[] = [
  { words: ['school', 'children', 'kids', 'playground'], label: 'Near children or a school' },
  { words: ['crosswalk', 'crossing', 'pedestrian', 'cruce', 'ਲਾਂਘ'], label: 'Pedestrian crossing affected' },
  { words: ['wheelchair', 'stroller', 'elderly', 'disab'], label: 'Accessibility for vulnerable residents' },
  { words: ['intersection', 'dangerous', 'confused', 'swerv', 'stuck'], label: 'Residents describe active danger' },
  { words: ['night', 'dark'], label: 'Worse after dark' },
]

const HOUR = 60 * 60 * 1000

function textFor(issue: Issue, reports: ResidentReport[]): string {
  return [issue.title, ...reports.map((r) => `${r.description} ${r.originalText ?? ''}`)].join(' ').toLowerCase()
}

function tierFor(score: number): UrgencyTier {
  if (score >= 75) return 'act_now'
  if (score >= 58) return 'today'
  if (score >= 40) return 'this_week'
  return 'routine'
}

/**
 * LENS urgency analysis (demo, rule-based): weighs several signals into an explainable
 * 0–100 score rather than sorting by the priority label alone.
 */
export function assessUrgency(issue: Issue, state: CivicState, now = Date.now()): UrgencyAssessment {
  const reports = issue.reportIds.map((id) => state.reports[id]).filter(Boolean)

  if (issue.status === 'resolved' || issue.status === 'community_verified') {
    return {
      issueId: issue.id,
      score: 0,
      tier: 'closed',
      factors: [{ label: issue.status === 'community_verified' ? 'Residents confirmed the fix' : 'Marked resolved', points: 0 }],
      rationale: issue.followUpRequested
        ? 'Marked resolved, but a resident says it is not fixed. Review before closing out.'
        : 'Closed. No action needed unless residents report it again.',
      confidence: 'High',
    }
  }

  const factors: UrgencyFactor[] = [{ label: HAZARD_LABEL[issue.priority], points: HAZARD_POINTS[issue.priority] }]
  if (ROADWAY_CATEGORIES.includes(issue.category) && issue.priority !== 'low') factors.push({ label: 'On an active roadway', points: 6 })

  const extraReports = reports.length - 1
  if (extraReports > 0) {
    const residents = new Set(reports.map((r) => r.residentId)).size
    factors.push({ label: `${reports.length} independent reports · ${residents} resident${residents === 1 ? '' : 's'}`, points: Math.min(18, extraReports * 7) })
  }

  if (issue.status === 'reported') {
    const hours = (now - issue.createdAt) / HOUR
    if (hours >= 1) factors.push({ label: `Unacknowledged for ${hours >= 48 ? `${Math.round(hours / 24)} days` : `${Math.round(hours)}h`}`, points: Math.min(14, Math.round(hours * 0.25 + 2)) })
    else factors.push({ label: 'No city response yet', points: 3 })
  }

  const text = textFor(issue, reports)
  const cues = VULNERABLE_CUES.filter((c) => c.words.some((w) => text.includes(w)))
  if (cues.length) factors.push({ label: cues.map((c) => c.label).slice(0, 2).join(' · '), points: Math.min(12, cues.length * 5) })

  if (issue.affectedArea.mode === 'area' && issue.affectedArea.radiusMeters) {
    factors.push({ label: `Wide affected area (~${issue.affectedArea.radiusMeters}m)`, points: Math.min(10, Math.round(issue.affectedArea.radiusMeters / 60)) })
  }

  if (issue.followUpRequested) factors.push({ label: 'Resident says the fix did not work', points: 12 })
  if (issue.status === 'reopened') factors.push({ label: 'Reopened after a failed fix', points: 10 })

  if (issue.status === 'in_progress') factors.push({ label: 'Crew already assigned and working', points: -14 })
  else if (issue.status === 'acknowledged' || issue.status === 'under_review') factors.push({ label: 'Acknowledged by the city', points: -5 })

  const score = Math.max(1, Math.min(99, Math.round(factors.reduce((s, f) => s + f.points, 0))))
  const tier = tierFor(score)

  const drivers = factors.filter((f) => f.points > 0).sort((a, b) => b.points - a.points).slice(0, 2).map((f) => f.label.toLowerCase())
  const tempering = factors.find((f) => f.points < 0)
  const rationale =
    `${TIER_LABEL[tier]}: driven by ${drivers.join(' and ')}.` +
    (tempering ? ` Urgency is tempered because ${tempering.label.toLowerCase()}.` : '')

  const confidence: UrgencyAssessment['confidence'] = reports.length >= 2 || issue.aiAnalysis.confidence === 'High' ? 'High' : cues.length ? 'Medium' : 'Low'

  return { issueId: issue.id, score, tier, factors, rationale, confidence }
}

export function rankIssues(state: CivicState, now = Date.now()): { issue: Issue; urgency: UrgencyAssessment }[] {
  return Object.values(state.issues)
    .map((issue) => ({ issue, urgency: assessUrgency(issue, state, now) }))
    .sort((a, b) => b.urgency.score - a.urgency.score || b.issue.updatedAt - a.issue.updatedAt)
}
