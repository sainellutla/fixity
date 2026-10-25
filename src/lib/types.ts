export type Priority = 'critical' | 'high' | 'medium' | 'low'

export type IssueStatus =
  | 'reported'
  | 'acknowledged'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'community_verified'
  | 'reopened'

export type Category =
  | 'traffic_safety'
  | 'road_damage'
  | 'public_lighting'
  | 'sidewalk_accessibility'
  | 'water_drainage'
  | 'public_parks'
  | 'waste_sanitation'
  | 'community_safety'
  | 'public_facilities'
  | 'other'

export type Severity = 'low' | 'medium' | 'high'

export type ResidentId = 'alex-rivera' | 'jordan-patel' | 'sam-chen' | 'taylor-brooks'

export interface AffectedArea {
  mode: 'point' | 'area'
  lat: number
  lng: number
  radiusMeters?: number
}

export interface TimelineEvent {
  id: string
  issueId: string
  label: string
  description: string
  createdAt: number
}

export interface AiAnalysis {
  classification: Priority
  issueType: string
  confidence: 'High' | 'Medium' | 'Low'
  reasoning: string
  suggestedDepartment: string
  recommendedAction: string
}

export interface Issue {
  id: string
  title: string
  category: Category
  lat: number
  lng: number
  affectedArea: AffectedArea
  priority: Priority
  status: IssueStatus
  createdAt: number
  updatedAt: number
  reportIds: string[]
  assignedDepartment: string | null
  resolutionEstimate: string | null
  timelineEvents: TimelineEvent[]
  aiAnalysis: AiAnalysis
  consensusSummary: string | null
  followUpRequested: boolean
  isSeed: boolean
}

export interface ResidentReport {
  id: string
  issueId: string
  residentId: ResidentId
  title: string
  description: string
  category: Category
  reportedSeverity: Severity
  photo: string | null
  createdAt: number
  /** Set when the report was spoken; `description` then holds the English translation. */
  spokenLanguage?: VoiceLanguage | null
  originalText?: string | null
}

export type VoiceLanguage = 'en' | 'es' | 'pa'

export interface CityUpdate {
  id: string
  issueId: string
  author: string
  status: IssueStatus
  title: string
  message: string
  assignedDepartment: string | null
  estimatedResolution: string | null
  createdAt: number
}

export type AuthorRole = 'resident' | 'leadership'

export interface Comment {
  id: string
  issueId: string
  authorId: string
  authorRole: AuthorRole
  message: string
  flagged: boolean
  createdAt: number
}

export interface Notification {
  id: string
  targetRole: AuthorRole
  targetResidentId: ResidentId | null
  issueId: string
  title: string
  message: string
  read: boolean
  createdAt: number
}

export interface Department {
  id: string
  name: string
  description: string
  supportedCategories: Category[]
}

export interface IssueFollow {
  residentId: ResidentId
  issueId: string
}

export interface CivicState {
  schemaVersion: 1
  issues: Record<string, Issue>
  reports: Record<string, ResidentReport>
  updates: Record<string, CityUpdate>
  comments: Record<string, Comment>
  notifications: Record<string, Notification>
  follows: Record<string, IssueFollow>
  planSteps: Record<string, PlanStepRecord>
}

export interface PlanStepRecord {
  issueId: string
  stepId: string
  done: boolean
  updatedAt: number
}
