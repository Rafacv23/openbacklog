import type { BetterAuthOptions } from "better-auth"

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"

import { getBaseUrl } from "@/lib/site"
import { db } from "@/server/db"
import * as schema from "@/server/db/schema"
import {
  sendAuthPasswordResetEmailFromContext,
  sendAuthVerificationEmailFromContext,
} from "@/server/email/send-auth-security-email"

const FALLBACK_DEVELOPMENT_SECRET =
  "openbacklog-dev-secret-change-before-production"

function normalizeUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

function getAuthBaseUrl(): string {
  const configuredUrl = process.env.BETTER_AUTH_URL?.trim()

  if (configuredUrl) {
    return normalizeUrl(configuredUrl)
  }

  return normalizeUrl(getBaseUrl())
}

function getAuthSecret(): string {
  const configuredSecret =
    process.env.BETTER_AUTH_SECRET?.trim() ?? process.env.AUTH_SECRET?.trim()

  if (configuredSecret) {
    return configuredSecret
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing BETTER_AUTH_SECRET. Define it before running in production.",
    )
  }

  return FALLBACK_DEVELOPMENT_SECRET
}

function getConfiguredProvider(clientId?: string, clientSecret?: string) {
  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret,
  }
}

const authBaseUrl = getAuthBaseUrl()

const googleProvider = getConfiguredProvider(
  process.env.GOOGLE_CLIENT_ID?.trim(),
  process.env.GOOGLE_CLIENT_SECRET?.trim(),
)

const githubProvider = getConfiguredProvider(
  process.env.GITHUB_CLIENT_ID?.trim(),
  process.env.GITHUB_CLIENT_SECRET?.trim(),
)

const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {
  ...(googleProvider
    ? {
        google: {
          ...googleProvider,
          prompt: "select_account",
        },
      }
    : {}),
  ...(githubProvider
    ? {
        github: githubProvider,
      }
    : {}),
}

export const enabledSocialAuthProviders = {
  google: Boolean(googleProvider),
  github: Boolean(githubProvider),
} as const

export type SocialAuthProvider = keyof typeof enabledSocialAuthProviders

export const auth = betterAuth({
  appName: "OpenBacklog",
  baseURL: authBaseUrl,
  secret: getAuthSecret(),
  trustedOrigins: Array.from(
    new Set([authBaseUrl, normalizeUrl(getBaseUrl())]),
  ),
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: false,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      try {
        await sendAuthPasswordResetEmailFromContext({
          email: user.email,
          resetUrl: url,
          request,
        })
      } catch (error) {
        console.error("[auth] Failed to send reset password email", {
          email: user.email,
          error,
        })
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }, request) => {
      try {
        await sendAuthVerificationEmailFromContext({
          email: user.email,
          verificationUrl: url,
          request,
        })
      } catch (error) {
        console.error("[auth] Failed to send verification email", {
          email: user.email,
          error,
        })
      }
    },
  },
  socialProviders,
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "memory",
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 10,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/request-password-reset": {
        window: 60,
        max: 3,
      },
      "/send-verification-email": {
        window: 60,
        max: 3,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [nextCookies()],
})

export const AUTH_PROVIDER = "better-auth" as const
export type AuthProvider = typeof AUTH_PROVIDER
export type Auth = typeof auth
