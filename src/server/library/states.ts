export const LIBRARY_STATES = [
  "planned",
  "playing",
  "completed",
  "dropped",
  "on_hold",
] as const

export type LibraryState = (typeof LIBRARY_STATES)[number]

const LIBRARY_STATE_SET = new Set<string>(LIBRARY_STATES)

export function isLibraryState(value: string): value is LibraryState {
  return LIBRARY_STATE_SET.has(value)
}

export function parseLibraryState(value: unknown): LibraryState | null {
  if (typeof value !== "string") {
    return null
  }

  return isLibraryState(value) ? value : null
}
