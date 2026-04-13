import { parseLibraryState, type LibraryState } from "@/server/library/states"

export const LIBRARY_SORT_VALUES = [
  "updated_desc",
  "release_desc",
  "rating_desc",
] as const

export type LibrarySort = (typeof LIBRARY_SORT_VALUES)[number]

const LIBRARY_SORT_SET = new Set<string>(LIBRARY_SORT_VALUES)

export function parseLibrarySort(value: unknown): LibrarySort {
  if (typeof value !== "string") {
    return "updated_desc"
  }

  return LIBRARY_SORT_SET.has(value) ? (value as LibrarySort) : "updated_desc"
}

export function parseLibraryPage(value: unknown): number {
  if (typeof value !== "string") {
    return 1
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1
  }

  return parsed
}

export function normalizeLibrarySearch(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().slice(0, 120)
}

export function parseOptionalLibraryState(value: unknown): LibraryState | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  return parseLibraryState(value)
}
