export function newId(): string {
  return crypto.randomUUID()
}

/** Deterministic short display code derived from an id — stable across tabs/reloads, no shared counter needed. */
export function displayCode(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  const num = 1000 + (hash % 9000)
  return `CL-${num}`
}
