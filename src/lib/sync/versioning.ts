import type { CivicState, Comment, Issue } from '../types'

function unionById<T>(a: Record<string, T>, b: Record<string, T>): Record<string, T> {
  return { ...a, ...b }
}

function mergeNewest<T extends { updatedAt: number }>(a: Record<string, T>, b: Record<string, T>): Record<string, T> {
  const out = { ...a }
  for (const [k, item] of Object.entries(b)) {
    if (!out[k] || item.updatedAt >= out[k].updatedAt) out[k] = item
  }
  return out
}

/**
 * Merges two versions of the same Issue. Scalar fields use last-write-wins by `updatedAt`.
 * Collections (reportIds, timelineEvents) are append-only and merged by union-of-id, so a
 * report or timeline entry added in one tab is never dropped by a scalar update from another.
 */
export function mergeIssue(local: Issue, incoming: Issue): Issue {
  const newer = incoming.updatedAt >= local.updatedAt ? incoming : local
  const older = newer === incoming ? local : incoming

  const reportIds = Array.from(new Set([...local.reportIds, ...incoming.reportIds]))
  const timelineById = new Map(older.timelineEvents.map((e) => [e.id, e]))
  for (const e of newer.timelineEvents) timelineById.set(e.id, e)
  const timelineEvents = Array.from(timelineById.values()).sort((a, b) => a.createdAt - b.createdAt)

  return {
    ...newer,
    reportIds,
    timelineEvents,
    followUpRequested: local.followUpRequested || incoming.followUpRequested,
  }
}

export function mergeComment(local: Comment, incoming: Comment): Comment {
  return { ...local, flagged: local.flagged || incoming.flagged }
}

/** Reconciles a full state blob read via the storage-event fallback against current in-memory state. */
export function mergeState(local: CivicState, incoming: CivicState): CivicState {
  const issues: Record<string, Issue> = { ...local.issues }
  for (const [id, issue] of Object.entries(incoming.issues)) {
    issues[id] = issues[id] ? mergeIssue(issues[id], issue) : issue
  }

  const comments: Record<string, Comment> = { ...local.comments }
  for (const [id, comment] of Object.entries(incoming.comments)) {
    comments[id] = comments[id] ? mergeComment(comments[id], comment) : comment
  }

  return {
    schemaVersion: 1,
    issues,
    comments,
    reports: unionById(local.reports, incoming.reports),
    updates: unionById(local.updates, incoming.updates),
    notifications: unionById(local.notifications, incoming.notifications),
    follows: unionById(local.follows, incoming.follows),
    planSteps: mergeNewest(local.planSteps ?? {}, incoming.planSteps ?? {}),
  }
}
