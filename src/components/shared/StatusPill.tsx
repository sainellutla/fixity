import type { IssueStatus, Priority } from '../../lib/types'

const PRIORITY_LABEL: Record<Priority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const STATUS_LABEL: Record<IssueStatus, string> = {
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  community_verified: 'Community Verified',
  reopened: 'Reopened',
}

const STATUS_CLASS: Record<IssueStatus, string> = {
  reported: 'cl-status-reported',
  acknowledged: 'cl-status-acknowledged',
  under_review: 'cl-status-underreview',
  in_progress: 'cl-status-inprogress',
  resolved: 'cl-status-resolved',
  community_verified: 'cl-status-communityverified',
  reopened: 'cl-status-reopened',
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return <span className={`cl-priority-pill cl-priority-${priority}`}>{PRIORITY_LABEL[priority]}</span>
}

export function StatusPill({ status }: { status: IssueStatus }) {
  return <span className={`cl-status-pill ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
}

export { STATUS_LABEL, PRIORITY_LABEL }
