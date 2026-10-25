/** Escapes user-generated text for safe rendering as plain text content. */
export function escapeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function isNonEmpty(input: string): boolean {
  return input.trim().length > 0
}

export function clampLength(input: string, max: number): string {
  return input.length > max ? input.slice(0, max) : input
}
