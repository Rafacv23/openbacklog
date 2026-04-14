export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

export function parseUsernameCandidate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (!USERNAME_PATTERN.test(normalized)) {
    return null
  }

  return normalized
}

export function parsePeopleSearch(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().slice(0, 80)
}
