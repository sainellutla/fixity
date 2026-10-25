import type {
  CivicState,
  Comment,
  Issue,
  IssueFollow,
  IssueStatus,
  Notification,
  PlanStepRecord,
  ResidentReport,
} from '../types'
import { mergeComment, mergeIssue } from './versioning'

export type Action =
  | { type: 'HYDRATE'; state: CivicState }
  | { type: 'RESET_DEMO'; state: CivicState }
  | { type: 'CREATE_ISSUE'; issue: Issue; report: ResidentReport; notification: Notification | null }
  | { type: 'ATTACH_REPORT'; issueId: string; report: ResidentReport; issuePatch: Partial<Issue>; notification: Notification | null }
  | { type: 'SET_STATUS'; issueId: string; status: IssueStatus; updatedAt: number; timelineEvent: Issue['timelineEvents'][number] }
  | { type: 'ASSIGN_DEPARTMENT'; issueId: string; departmentId: string; updatedAt: number; timelineEvent: Issue['timelineEvents'][number] }
  | {
      type: 'PUBLISH_UPDATE'
      issueId: string
      update: { id: string; issueId: string; author: string; status: IssueStatus; title: string; message: string; assignedDepartment: string | null; estimatedResolution: string | null; createdAt: number }
      status: IssueStatus
      assignedDepartment: string | null
      resolutionEstimate: string | null
      updatedAt: number
      timelineEvent: Issue['timelineEvents'][number]
      notifications: Notification[]
    }
  | { type: 'ADD_COMMENT'; comment: Comment; notification: Notification | null }
  | { type: 'FLAG_COMMENT'; commentId: string }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; notificationId: string }
  | { type: 'SET_FOLLOW'; follow: IssueFollow; following: boolean }
  | { type: 'SUBMIT_VERIFICATION'; issueId: string; updatedAt: number; status: IssueStatus; followUpRequested: boolean; timelineEvent: Issue['timelineEvents'][number]; comment: Comment | null }
  | { type: 'SET_PLAN_STEP'; record: PlanStepRecord }
  | { type: 'REOPEN_ISSUE'; issueId: string; updatedAt: number; timelineEvent: Issue['timelineEvents'][number] }

function patchIssue(state: CivicState, issueId: string, updatedAt: number, patch: Partial<Issue>, timelineEvent?: Issue['timelineEvents'][number]): CivicState {
  const existing = state.issues[issueId]
  if (!existing) return state
  if (updatedAt < existing.updatedAt) return state // stale write, discard

  const timelineEvents = timelineEvent ? [...existing.timelineEvents, timelineEvent] : existing.timelineEvents

  return {
    ...state,
    issues: {
      ...state.issues,
      [issueId]: { ...existing, ...patch, updatedAt, timelineEvents },
    },
  }
}

export function civicReducer(state: CivicState, action: Action): CivicState {
  switch (action.type) {
    case 'HYDRATE':
    case 'RESET_DEMO':
      return action.state

    case 'CREATE_ISSUE': {
      const next: CivicState = {
        ...state,
        issues: { ...state.issues, [action.issue.id]: action.issue },
        reports: { ...state.reports, [action.report.id]: action.report },
      }
      if (action.notification) {
        next.notifications = { ...next.notifications, [action.notification.id]: action.notification }
      }
      return next
    }

    case 'ATTACH_REPORT': {
      const existing = state.issues[action.issueId]
      if (!existing) return state
      const merged = mergeIssue(existing, { ...existing, ...action.issuePatch, reportIds: [...existing.reportIds, action.report.id] })
      const next: CivicState = {
        ...state,
        issues: { ...state.issues, [action.issueId]: merged },
        reports: { ...state.reports, [action.report.id]: action.report },
      }
      if (action.notification) {
        next.notifications = { ...next.notifications, [action.notification.id]: action.notification }
      }
      return next
    }

    case 'SET_STATUS':
      return patchIssue(state, action.issueId, action.updatedAt, { status: action.status }, action.timelineEvent)

    case 'ASSIGN_DEPARTMENT':
      return patchIssue(state, action.issueId, action.updatedAt, { assignedDepartment: action.departmentId }, action.timelineEvent)

    case 'PUBLISH_UPDATE': {
      const next = patchIssue(
        state,
        action.issueId,
        action.updatedAt,
        { status: action.status, assignedDepartment: action.assignedDepartment, resolutionEstimate: action.resolutionEstimate },
        action.timelineEvent,
      )
      const updates = { ...next.updates, [action.update.id]: action.update }
      const notifications = { ...next.notifications }
      for (const n of action.notifications) notifications[n.id] = n
      return { ...next, updates, notifications }
    }

    case 'ADD_COMMENT': {
      const next: CivicState = { ...state, comments: { ...state.comments, [action.comment.id]: action.comment } }
      if (action.notification) {
        next.notifications = { ...next.notifications, [action.notification.id]: action.notification }
      }
      return next
    }

    case 'FLAG_COMMENT': {
      const existing = state.comments[action.commentId]
      if (!existing) return state
      return { ...state, comments: { ...state.comments, [action.commentId]: mergeComment(existing, { ...existing, flagged: true }) } }
    }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: { ...state.notifications, [action.notification.id]: action.notification } }

    case 'MARK_NOTIFICATION_READ': {
      const existing = state.notifications[action.notificationId]
      if (!existing) return state
      return { ...state, notifications: { ...state.notifications, [action.notificationId]: { ...existing, read: true } } }
    }

    case 'SET_FOLLOW': {
      const key = `${action.follow.residentId}:${action.follow.issueId}`
      if (action.following) {
        return { ...state, follows: { ...state.follows, [key]: action.follow } }
      }
      const { [key]: _removed, ...rest } = state.follows
      return { ...state, follows: rest }
    }

    case 'SUBMIT_VERIFICATION': {
      const next = patchIssue(state, action.issueId, action.updatedAt, { status: action.status, followUpRequested: action.followUpRequested }, action.timelineEvent)
      if (action.comment) {
        return { ...next, comments: { ...next.comments, [action.comment.id]: action.comment } }
      }
      return next
    }

    case 'SET_PLAN_STEP': {
      const key = `${action.record.issueId}:${action.record.stepId}`
      const existing = state.planSteps?.[key]
      if (existing && existing.updatedAt > action.record.updatedAt) return state
      return { ...state, planSteps: { ...(state.planSteps ?? {}), [key]: action.record } }
    }

    case 'REOPEN_ISSUE':
      return patchIssue(state, action.issueId, action.updatedAt, { status: 'reopened', followUpRequested: false }, action.timelineEvent)

    default:
      return state
  }
}
