import { headers } from "next/headers"

import { auth } from "@/server/auth"

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>

export async function getAuthSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session ?? null
}

export function getSessionUsername(session: AuthSession | null): string | null {
  if (!session) {
    return null
  }

  const rawUsername = (session.user as { username?: unknown }).username

  if (typeof rawUsername !== "string") {
    return null
  }

  const normalizedUsername = rawUsername.trim().toLowerCase()

  return normalizedUsername.length > 0 ? normalizedUsername : null
}
