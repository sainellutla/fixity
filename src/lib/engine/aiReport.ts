import { CATEGORY_LABELS, departmentForCategory } from '../departments'
import type { CivicState, Issue } from '../types'
import { assessUrgency } from './urgency'

export interface IntelligenceFinding {
  issueId: string
  title: string
  category: string
  reportCount: number
  narrative: string
  riskAssessment: string
  recommendedResponse: string
  operationalSteps: string[]
  suggestedDepartment: string
  suggestedCommunication: string
}

export interface IntelligenceReport {
  generatedAt: number
  cityName: string
  overallPriority: Issue['priority']
  findings: IntelligenceFinding[]
}


function riskLine(issue: Issue): string {
  switch (issue.priority) {
    case 'critical':
      return 'Potential immediate public safety hazard.'
    case 'high':
      return 'Meaningful risk to road or pedestrian safety if left unaddressed.'
    case 'medium':
      return 'Moderate concern; manageable through normal maintenance workflows.'
    default:
      return 'Low risk; primarily a cosmetic or quality-of-life concern.'
  }
}

function responseLine(issue: Issue): string {
  switch (issue.priority) {
    case 'critical':
      return 'Escalate for prompt field verification by the responsible department.'
    case 'high':
      return 'Schedule inspection within the department\'s standard priority window.'
    default:
      return 'Route to the responsible department for routine handling.'
  }
}

/**
 * Builds a deterministic, template-based "intelligence report" from whichever issues
 * currently exist in the store — never fabricates issues, contractors, or dispatch
 * confirmations that aren't backed by real demo state.
 */
export function generateIntelligenceReport(state: CivicState): IntelligenceReport {
  const issues = Object.values(state.issues)
    .filter((i) => i.status !== 'resolved' && i.status !== 'community_verified')
    .sort((a, b) => assessUrgency(b, state).score - assessUrgency(a, state).score || b.updatedAt - a.updatedAt)

  const findings: IntelligenceFinding[] = issues.map((issue) => {
    const department = departmentForCategory(issue.category)
    const reportCount = issue.reportIds.length
    const categoryLabel = CATEGORY_LABELS[issue.category]

    const narrative =
      reportCount > 1
        ? issue.consensusSummary ??
          `Multiple residents have independently reported a ${issue.aiAnalysis.issueType.toLowerCase()} (“${issue.title}”). Reports consistently describe the same underlying problem.`
        : issue.aiAnalysis.reasoning

    return {
      issueId: issue.id,
      title: issue.title,
      category: categoryLabel,
      reportCount,
      narrative,
      riskAssessment: riskLine(issue),
      recommendedResponse: responseLine(issue),
      operationalSteps: [
        'Confirm the reported location and any affected equipment.',
        `Notify ${department.name} of the demo finding.`,
        'Review availability of approved maintenance resources.',
        'Arrange temporary mitigation if warranted by field assessment.',
        'Publish a public update as the issue is addressed.',
      ],
      suggestedDepartment: `${department.name} (Demo Directory)`,
      suggestedCommunication: `We have received ${reportCount > 1 ? 'multiple reports' : 'a report'} regarding “${issue.title}” and are prioritizing assessment. We will provide further updates as information becomes available.`,
    }
  })

  const overallPriority = issues[0]?.priority ?? 'low'

  return {
    generatedAt: Date.now(),
    cityName: 'Manteca, CA',
    overallPriority,
    findings,
  }
}
