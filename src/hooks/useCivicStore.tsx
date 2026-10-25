import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { classifyReport } from '../lib/engine/classify'
import { buildConsensusSummary, findMatchingIssue } from '../lib/engine/group'
import { departmentById } from '../lib/departments'
import { newId } from '../lib/ids'
import { buildSeedState } from '../lib/seed'
import { languageLabel } from '../lib/voiceScripts'
import { readState, writeState } from '../lib/storage'
import { civicReducer, type Action } from '../lib/sync/store'
import { SyncChannel } from '../lib/sync/channel'
import { mergeState } from '../lib/sync/versioning'
import { STORAGE_KEY } from '../lib/storage'
import type {
  AuthorRole,
  Category,
  CivicState,
  Comment,
  Issue,
  IssueStatus,
  Notification,
  ResidentId,
  Severity,
  VoiceLanguage,
} from '../lib/types'

interface SubmitReportInput {
  title: string
  description: string
  category: Category
  severity: Severity
  photo: string | null
  mode: 'point' | 'area'
  lat: number
  lng: number
  radiusMeters?: number
  residentId: ResidentId
  spokenLanguage?: VoiceLanguage | null
  originalText?: string | null
}

interface PublishUpdateInput {
  title: string
  message: string
  status: IssueStatus
  departmentId: string | null
  estimatedResolution: string | null
  author: string
}

interface CivicActions {
  submitReport: (input: SubmitReportInput) => { issueId: string; isNew: boolean; analysis: Issue['aiAnalysis'] }
  setStatus: (issueId: string, status: IssueStatus, label: string, description: string) => void
  assignDepartment: (issueId: string, departmentId: string) => void
  publishUpdate: (issueId: string, input: PublishUpdateInput) => void
  addComment: (issueId: string, authorId: string, authorRole: AuthorRole, message: string) => void
  flagComment: (commentId: string) => void
  toggleFollow: (residentId: ResidentId, issueId: string, following: boolean) => void
  submitVerification: (issueId: string, residentId: ResidentId, verified: 'yes' | 'no' | 'unsure', note?: string) => void
  reopenIssue: (issueId: string) => void
  setPlanStep: (issueId: string, stepId: string, done: boolean) => void
  resetDemo: () => void
  markNotificationRead: (id: string) => void
}

interface CivicContextValue {
  state: CivicState
  actions: CivicActions
}

const CivicContext = createContext<CivicContextValue | null>(null)

function timelineEvent(issueId: string, label: string, description: string): Issue['timelineEvents'][number] {
  return { id: newId(), issueId, label, description, createdAt: Date.now() }
}

export function CivicStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(civicReducer, undefined, () => {
    return readState() ?? buildSeedState()
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const channelRef = useRef<SyncChannel | null>(null)

  const dispatchLocal = useCallback((action: Action) => {
    dispatch(action)
    channelRef.current?.post(action)
  }, [])

  useEffect(() => {
    channelRef.current = new SyncChannel((action) => dispatch(action))
    return () => channelRef.current?.close()
  }, [])

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const incoming = JSON.parse(event.newValue) as CivicState
        dispatch({ type: 'HYDRATE', state: mergeState(stateRef.current, incoming) })
      } catch {
        // ignore malformed payloads from other contexts
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    writeState(state)
  }, [state])

  const actions = useMemo<CivicActions>(() => {
    return {
      submitReport(input) {
        const existing = findMatchingIssue(
          { title: input.title, description: input.description, category: input.category },
          input.lat,
          input.lng,
          Object.values(stateRef.current.issues),
          stateRef.current.reports,
        )

        const analysis = classifyReport({ title: input.title, description: input.description, category: input.category })
        const voiceNote = input.spokenLanguage && input.spokenLanguage !== 'en' ? ` · reported by voice in ${languageLabel(input.spokenLanguage)}` : ''
        const reportId = newId()
        const report = {
          id: reportId,
          issueId: existing?.id ?? '',
          residentId: input.residentId,
          title: input.title,
          description: input.description,
          category: input.category,
          reportedSeverity: input.severity,
          photo: input.photo,
          createdAt: Date.now(),
          spokenLanguage: input.spokenLanguage ?? null,
          originalText: input.originalText ?? null,
        }

        if (existing) {
          report.issueId = existing.id
          const allReports = [...existing.reportIds.map((id) => stateRef.current.reports[id]).filter(Boolean), report]
          const consensusSummary = buildConsensusSummary(existing.aiAnalysis.issueType, allReports)
          const notification: Notification = {
            id: newId(),
            targetRole: 'leadership',
            targetResidentId: null,
            issueId: existing.id,
            title: 'Additional Report Received',
            message: `Another resident reported ${existing.title}${voiceNote}. ${allReports.length} independent reports now on file.`,
            read: false,
            createdAt: Date.now(),
          }
          dispatchLocal({
            type: 'ATTACH_REPORT',
            issueId: existing.id,
            report,
            issuePatch: { consensusSummary, updatedAt: Date.now() },
            notification,
          })
          return { issueId: existing.id, isNew: false, analysis: existing.aiAnalysis }
        }

        const issueId = newId()
        report.issueId = issueId
        const issue: Issue = {
          id: issueId,
          title: input.title,
          category: input.category,
          lat: input.lat,
          lng: input.lng,
          affectedArea: { mode: input.mode, lat: input.lat, lng: input.lng, radiusMeters: input.radiusMeters },
          priority: analysis.classification,
          status: 'reported',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          reportIds: [reportId],
          assignedDepartment: null,
          resolutionEstimate: null,
          timelineEvents: [timelineEvent(issueId, 'Reported', 'Resident submitted issue.')],
          aiAnalysis: analysis,
          consensusSummary: null,
          followUpRequested: false,
          isSeed: false,
        }
        const notification: Notification = {
          id: newId(),
          targetRole: 'leadership',
          targetResidentId: null,
          issueId,
          title: 'New Resident Issue Detected',
          message: `${input.title}${voiceNote}`,
          read: false,
          createdAt: Date.now(),
        }
        dispatchLocal({ type: 'CREATE_ISSUE', issue, report, notification })
        return { issueId, isNew: true, analysis }
      },

      setStatus(issueId, status, label, description) {
        dispatchLocal({ type: 'SET_STATUS', issueId, status, updatedAt: Date.now(), timelineEvent: timelineEvent(issueId, label, description) })
      },

      assignDepartment(issueId, departmentId) {
        const dept = departmentById(departmentId)
        dispatchLocal({
          type: 'ASSIGN_DEPARTMENT',
          issueId,
          departmentId,
          updatedAt: Date.now(),
          timelineEvent: timelineEvent(issueId, 'Department Assigned', `Assigned to ${dept?.name ?? 'a department'}.`),
        })
      },

      publishUpdate(issueId, input) {
        const updateId = newId()
        const issue = stateRef.current.issues[issueId]
        const update = {
          id: updateId,
          issueId,
          author: input.author,
          status: input.status,
          title: input.title,
          message: input.message,
          assignedDepartment: input.departmentId,
          estimatedResolution: input.estimatedResolution,
          createdAt: Date.now(),
        }

        const notifications: Notification[] = []
        const followers = Object.values(stateRef.current.follows).filter((f) => f.issueId === issueId)
        const reportResidentIds = new Set(
          issue?.reportIds.map((id) => stateRef.current.reports[id]?.residentId).filter(Boolean) ?? [],
        )
        const notifyResidentIds = new Set<string>([...followers.map((f) => f.residentId), ...reportResidentIds])
        for (const residentId of notifyResidentIds) {
          notifications.push({
            id: newId(),
            targetRole: 'resident',
            targetResidentId: residentId as ResidentId,
            issueId,
            title: 'Your Report Has Been Updated',
            message: input.title,
            read: false,
            createdAt: Date.now(),
          })
        }

        dispatchLocal({
          type: 'PUBLISH_UPDATE',
          issueId,
          update,
          status: input.status,
          assignedDepartment: input.departmentId,
          resolutionEstimate: input.estimatedResolution,
          updatedAt: Date.now(),
          timelineEvent: timelineEvent(issueId, input.title, input.message),
          notifications,
        })
      },

      addComment(issueId, authorId, authorRole, message) {
        const comment: Comment = {
          id: newId(),
          issueId,
          authorId,
          authorRole,
          message,
          flagged: false,
          createdAt: Date.now(),
        }
        let notification: Notification | null = null
        if (authorRole === 'leadership') {
          const issue = stateRef.current.issues[issueId]
          const reportResidentIds = new Set(
            issue?.reportIds.map((id) => stateRef.current.reports[id]?.residentId).filter(Boolean) ?? [],
          )
          const first = [...reportResidentIds][0] as ResidentId | undefined
          if (first) {
            notification = {
              id: newId(),
              targetRole: 'resident',
              targetResidentId: first,
              issueId,
              title: 'Official City Response',
              message,
              read: false,
              createdAt: Date.now(),
            }
          }
        } else {
          notification = {
            id: newId(),
            targetRole: 'leadership',
            targetResidentId: null,
            issueId,
            title: 'New Resident Question',
            message,
            read: false,
            createdAt: Date.now(),
          }
        }
        dispatchLocal({ type: 'ADD_COMMENT', comment, notification })
      },

      flagComment(commentId) {
        dispatchLocal({ type: 'FLAG_COMMENT', commentId })
      },

      toggleFollow(residentId, issueId, following) {
        dispatchLocal({ type: 'SET_FOLLOW', follow: { residentId, issueId }, following })
      },

      submitVerification(issueId, residentId, verified, note) {
        const followUpRequested = verified === 'no'
        const status: IssueStatus = followUpRequested ? 'resolved' : verified === 'yes' ? 'community_verified' : 'resolved'
        const comment: Comment | null = note
          ? { id: newId(), issueId, authorId: residentId, authorRole: 'resident', message: note, flagged: false, createdAt: Date.now() }
          : null
        dispatchLocal({
          type: 'SUBMIT_VERIFICATION',
          issueId,
          updatedAt: Date.now(),
          status,
          followUpRequested,
          timelineEvent: timelineEvent(
            issueId,
            'Community Verification',
            verified === 'yes' ? 'Resident confirmed the issue is resolved.' : verified === 'no' ? 'Resident requested follow-up.' : 'Resident was unsure if the issue is resolved.',
          ),
          comment,
        })
      },

      reopenIssue(issueId) {
        dispatchLocal({ type: 'REOPEN_ISSUE', issueId, updatedAt: Date.now(), timelineEvent: timelineEvent(issueId, 'Reopened', 'City leadership reopened this issue for further review.') })
      },

      setPlanStep(issueId, stepId, done) {
        dispatchLocal({ type: 'SET_PLAN_STEP', record: { issueId, stepId, done, updatedAt: Date.now() } })
      },

      resetDemo() {
        dispatchLocal({ type: 'RESET_DEMO', state: buildSeedState() })
      },

      markNotificationRead(id) {
        dispatchLocal({ type: 'MARK_NOTIFICATION_READ', notificationId: id })
      },
    }
  }, [dispatchLocal])

  const value = useMemo(() => ({ state, actions }), [state, actions])

  return <CivicContext.Provider value={value}>{children}</CivicContext.Provider>
}

export function useCivicStore(): CivicContextValue {
  const ctx = useContext(CivicContext)
  if (!ctx) throw new Error('useCivicStore must be used within CivicStoreProvider')
  return ctx
}
