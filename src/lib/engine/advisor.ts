import { departmentForCategory } from '../departments'
import type { CivicState, Issue } from '../types'
import { assessUrgency } from './urgency'

function activeIssues(state: CivicState): Issue[] {
  return Object.values(state.issues)
    .filter((i) => i.status !== 'resolved' && i.status !== 'community_verified')
    .sort((a, b) => assessUrgency(b, state).score - assessUrgency(a, state).score || b.updatedAt - a.updatedAt)
}

/** LENS's one-line read on the city for leadership — deterministic, from current demo state. */
export function leadershipRemark(state: CivicState): string {
  const active = activeIssues(state)
  if (active.length === 0) return 'No open issues right now. A quiet day in Manteca.'
  const top = active[0]
  const followUps = active.filter((i) => i.followUpRequested).length
  if (top.priority === 'critical') {
    const unacked = top.status === 'reported'
    return `${top.title} is critical${top.reportIds.length > 1 ? ` with ${top.reportIds.length} independent reports` : ''}. ${unacked ? 'It has not been acknowledged yet. ' : ''}Route it to ${departmentForCategory(top.category).name}.`
  }
  if (followUps > 0) return `${followUps} resolved issue${followUps === 1 ? '' : 's'} got a "not fixed" from residents. Worth a second look.`
  const unacked = active.filter((i) => i.status === 'reported').length
  return `${active.length} open issues. ${unacked ? `${unacked} still waiting for acknowledgment.` : 'Every one has been acknowledged.'} Top concern: ${top.title}.`
}

/** LENS's one-line read for residents. */
export function residentRemark(state: CivicState): string {
  const active = activeIssues(state)
  const inProgress = active.filter((i) => i.status === 'in_progress').length
  if (active.length === 0) return 'Nothing open near you. Spot something? Pin it on the map.'
  return `${active.length} open issue${active.length === 1 ? '' : 's'} in Manteca${inProgress ? `, ${inProgress} being worked on` : ''}. Spotted something new? Pin it and earn civic points.`
}
