import { classifyReport } from './engine/classify'
import { departmentForCategory } from './departments'
import { MANTECA_CENTER } from './geo'
import { newId } from './ids'
import { emptyState } from './storage'
import type { AiAnalysis, Category, CivicState, Issue, IssueStatus, ResidentReport } from './types'

interface SeedDef {
  title: string
  description: string
  category: Category
  priority: Issue['priority']
  status: IssueStatus
  offset: [number, number]
  daysAgo: number
}

const SEED_ISSUES: SeedDef[] = [
  {
    title: 'Large pothole on Yosemite Ave',
    description: 'There is a large pothole in the right lane that is causing drivers to swerve.',
    category: 'road_damage',
    priority: 'high',
    status: 'reported',
    offset: [0.0035, 0.0062],
    daysAgo: 4,
  },
  {
    title: 'Broken light at Library Park',
    description: 'The park light near the playground has been out for over a week.',
    category: 'public_lighting',
    priority: 'medium',
    status: 'in_progress',
    offset: [0.0021, -0.0068],
    daysAgo: 6,
  },
  {
    title: 'Recurring congestion on Main St',
    description: 'Traffic backs up every afternoon near the Main St and Center St intersection.',
    category: 'traffic_safety',
    priority: 'high',
    status: 'under_review',
    offset: [-0.0032, 0.0018],
    daysAgo: 8,
  },
  {
    title: 'Blocked sidewalk near Lincoln Park',
    description: 'Overgrown landscaping is blocking the sidewalk, forcing pedestrians into the street.',
    category: 'sidewalk_accessibility',
    priority: 'medium',
    status: 'resolved',
    offset: [-0.0048, -0.0074],
    daysAgo: 12,
  },
]

// Seed reports belong to residents other than Alex, the default demo identity, so Alex starts at zero civic points.
const SEED_REPORTERS: ResidentReport['residentId'][] = ['sam-chen', 'taylor-brooks']

function buildSeedIssue(def: SeedDef, index: number): { issue: Issue; report: ResidentReport } {
  const lat = MANTECA_CENTER[0] + def.offset[0]
  const lng = MANTECA_CENTER[1] + def.offset[1]
  const now = Date.now()
  const createdAt = now - def.daysAgo * 24 * 60 * 60 * 1000
  const issueId = newId()
  const reportId = newId()

  const analysis: AiAnalysis = {
    ...classifyReport({ title: def.title, description: def.description, category: def.category }),
    classification: def.priority,
  }
  const department = departmentForCategory(def.category)

  const report: ResidentReport = {
    id: reportId,
    issueId,
    residentId: SEED_REPORTERS[index % SEED_REPORTERS.length],
    title: def.title,
    description: def.description,
    category: def.category,
    reportedSeverity: def.priority === 'high' ? 'high' : 'medium',
    photo: null,
    createdAt,
  }

  const issue: Issue = {
    id: issueId,
    title: def.title,
    category: def.category,
    lat,
    lng,
    affectedArea: { mode: 'point', lat, lng },
    priority: def.priority,
    status: def.status,
    createdAt,
    updatedAt: createdAt,
    reportIds: [reportId],
    assignedDepartment: def.status === 'reported' ? null : department.id,
    resolutionEstimate: null,
    timelineEvents: [
      { id: newId(), issueId, label: 'Reported', description: 'Resident submitted issue.', createdAt },
    ],
    aiAnalysis: analysis,
    consensusSummary: null,
    followUpRequested: false,
    isSeed: true,
  }

  return { issue, report }
}

export function buildSeedState(): CivicState {
  const state = emptyState()
  for (const [index, def] of SEED_ISSUES.entries()) {
    const { issue, report } = buildSeedIssue(def, index)
    state.issues[issue.id] = issue
    state.reports[report.id] = report
  }
  return state
}
