import type { CivicState, ResidentId } from '../types'

export interface Badge {
  id: string
  label: string
  hint: string
  earned: boolean
}

export interface CivicRecord {
  points: number
  level: number
  levelName: string
  nextLevelAt: number | null
  levelProgress: number
  reports: number
  firstSpots: number
  confirmations: number
  questions: number
  fixesSparked: number
  badges: Badge[]
}

export const POINTS = { report: 10, firstSpot: 15, confirm: 5, question: 2, fixSparked: 20 }

const LEVELS = [
  { at: 0, name: 'Newcomer' },
  { at: 25, name: 'Neighbor' },
  { at: 60, name: 'Advocate' },
  { at: 120, name: 'Civic Champion' },
]

/** Derives a resident's civic points and badges purely from stored demo activity. */
export function civicRecord(state: CivicState, residentId: ResidentId): CivicRecord {
  const myReports = Object.values(state.reports).filter((r) => r.residentId === residentId)
  let firstSpots = 0
  let confirmations = 0
  const sparkedIssues = new Set<string>()

  for (const report of myReports) {
    const issue = state.issues[report.issueId]
    if (!issue) continue
    if (issue.reportIds[0] === report.id) firstSpots += 1
    else confirmations += 1
    if (issue.status === 'resolved' || issue.status === 'community_verified') sparkedIssues.add(issue.id)
  }

  const questions = Object.values(state.comments).filter((c) => c.authorRole === 'resident' && c.authorId === residentId).length
  const fixesSparked = sparkedIssues.size

  const points =
    myReports.length * POINTS.report +
    firstSpots * POINTS.firstSpot +
    confirmations * POINTS.confirm +
    questions * POINTS.question +
    fixesSparked * POINTS.fixSparked

  let levelIdx = 0
  LEVELS.forEach((l, i) => { if (points >= l.at) levelIdx = i })
  const next = LEVELS[levelIdx + 1]
  const levelProgress = next ? ((points - LEVELS[levelIdx].at) / (next.at - LEVELS[levelIdx].at)) * 100 : 100

  return {
    points,
    level: levelIdx + 1,
    levelName: LEVELS[levelIdx].name,
    nextLevelAt: next?.at ?? null,
    levelProgress,
    reports: myReports.length,
    firstSpots,
    confirmations,
    questions,
    fixesSparked,
    badges: [
      { id: 'first-report', label: 'First Report', hint: 'Submit your first report', earned: myReports.length > 0 },
      { id: 'first-spotter', label: 'First Spotter', hint: 'Be the first to report an issue', earned: firstSpots > 0 },
      { id: 'confirmer', label: 'Confirmer', hint: "Confirm a neighbor's report", earned: confirmations > 0 },
      { id: 'voice', label: 'Civic Voice', hint: 'Ask the city a question', earned: questions > 0 },
      { id: 'spark', label: 'Spark', hint: 'A report of yours gets resolved', earned: fixesSparked > 0 },
    ],
  }
}
