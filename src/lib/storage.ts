import type { CivicState } from './types'

export const STORAGE_KEY = 'civiclens:v1:state'
export const RESIDENT_IDENTITY_KEY = 'civiclens:v1:resident-identity'

export function readState(): CivicState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return { ...emptyState(), ...(JSON.parse(raw) as Partial<CivicState>) }
  } catch {
    return null
  }
}

export function writeState(state: CivicState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable (e.g. private mode quota) — demo continues in-memory only.
  }
}

export function emptyState(): CivicState {
  return {
    schemaVersion: 1,
    issues: {},
    reports: {},
    updates: {},
    comments: {},
    notifications: {},
    follows: {},
    planSteps: {},
  }
}
