import { distanceMeters } from '../geo'
import type { Category, Issue, ResidentReport } from '../types'

const GROUPING_RADIUS_METERS = 100

// Keyword groups: reports whose text falls in the same group as the existing issue's
// classified issue type are treated as compatible, even if the phrasing differs.
const KEYWORD_GROUPS: Record<string, string[]> = {
  traffic_signal: ['traffic light', 'traffic signal', 'stoplight', 'stop light', 'signal', 'red light'],
  stop_sign: ['stop sign'],
  pothole: ['pothole', 'road damage', 'crater'],
  streetlight: ['streetlight', 'street light', 'lamp post', 'lighting'],
  flooding: ['flood', 'drainage', 'standing water', 'drain'],
  sidewalk: ['sidewalk', 'curb', 'ramp'],
  congestion: ['congestion', 'traffic backup', 'backed up'],
}

function keywordGroupsFor(text: string): Set<string> {
  const lower = text.toLowerCase()
  const groups = new Set<string>()
  for (const [group, keywords] of Object.entries(KEYWORD_GROUPS)) {
    if (keywords.some((kw) => lower.includes(kw))) groups.add(group)
  }
  return groups
}

export interface GroupingCandidateReport {
  title: string
  description: string
  category: Category
}

/**
 * Decides whether a new report should join an existing issue (same underlying problem)
 * vs. start a new one: requires proximity AND category match AND compatible wording.
 */
export function findMatchingIssue(
  candidate: GroupingCandidateReport,
  lat: number,
  lng: number,
  issues: Issue[],
  reportsById: Record<string, ResidentReport>,
): Issue | null {
  const candidateGroups = keywordGroupsFor(`${candidate.title} ${candidate.description}`)

  for (const issue of issues) {
    if (distanceMeters(lat, lng, issue.lat, issue.lng) > GROUPING_RADIUS_METERS) continue
    if (issue.category !== candidate.category) continue

    const firstReport = issue.reportIds.map((id) => reportsById[id]).find(Boolean)
    const issueGroups = keywordGroupsFor(`${issue.title} ${firstReport?.description ?? ''}`)

    const hasOverlap = [...candidateGroups].some((g) => issueGroups.has(g))
    if (hasOverlap || (candidateGroups.size === 0 && issueGroups.size === 0)) {
      return issue
    }
  }

  return null
}

export function buildConsensusSummary(issueType: string, reports: ResidentReport[]): string {
  const count = reports.length
  if (count <= 1) return null as unknown as string

  const uniqueResidents = new Set(reports.map((r) => r.residentId)).size
  const subject = issueType.toLowerCase()
  return `${count} independent resident report${count === 1 ? '' : 's'} (${uniqueResidents} unique resident${uniqueResidents === 1 ? '' : 's'}) describe ${subject}. Reports consistently indicate the same underlying issue. Prompt inspection is recommended.`
}
