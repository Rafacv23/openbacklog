import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"

function normalizeUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return value.endsWith("/") ? value.slice(0, -1) : value
}

function resolveAuthBaseUrl(): string | undefined {
  if (typeof window !== "undefined") {
    return normalizeUrl(window.location.origin)
  }

  return normalizeUrl(process.env.NEXT_PUBLIC_APP_BASE_URL)
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseUrl(),
  plugins: [usernameClient()],
})

export const { useSession } = authClient
