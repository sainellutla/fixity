import { useSyncExternalStore } from 'react'
import { RESIDENT_IDENTITY_KEY } from '../lib/storage'
import type { ResidentId } from '../lib/types'

export const RESIDENTS: { id: ResidentId; name: string }[] = [
  { id: 'alex-rivera', name: 'Alex Rivera' },
  { id: 'jordan-patel', name: 'Jordan Patel' },
  { id: 'sam-chen', name: 'Sam Chen' },
  { id: 'taylor-brooks', name: 'Taylor Brooks' },
]

// Identity is per-tab (sessionStorage) so two resident tabs can act as different residents.
function readInitial(): ResidentId {
  try {
    const stored = sessionStorage.getItem(RESIDENT_IDENTITY_KEY)
    return RESIDENTS.find((r) => r.id === stored)?.id ?? RESIDENTS[0].id
  } catch {
    return RESIDENTS[0].id
  }
}

let current: ResidentId = readInitial()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function switchResident(id: ResidentId) {
  current = id
  try {
    sessionStorage.setItem(RESIDENT_IDENTITY_KEY, id)
  } catch {
    // storage unavailable — identity still switches in memory
  }
  listeners.forEach((l) => l())
}

export function residentName(id: string): string {
  return RESIDENTS.find((r) => r.id === id)?.name ?? 'Resident'
}

export function useCurrentResident() {
  const residentId = useSyncExternalStore(subscribe, () => current)
  const resident = RESIDENTS.find((r) => r.id === residentId) ?? RESIDENTS[0]
  return { resident, residentId, switchResident, residents: RESIDENTS }
}
