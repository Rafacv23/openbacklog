import { NextResponse } from "next/server"

import { toSupportedLocale } from "@/lib/locales"
import { registerPreRegistration } from "@/server/pre-registrations/register-pre-registration"
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit"

type CreatePreRegistrationRequestBody = {
  company?: unknown
  email?: unknown
  locale?: unknown
}

export const runtime = "nodejs"

const WAITLIST_RATE_LIMITS = {
  byEmail: {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  },
  byIp: {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  },
} as const

export async function POST(request: Request) {
  let body: CreatePreRegistrationRequestBody

  try {
    body = (await request.json()) as CreatePreRegistrationRequestBody
  } catch {
    return NextResponse.json({ status: "invalid_email" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email : ""
  const localeCandidate = typeof body.locale === "string" ? body.locale : "en"
  const locale = toSupportedLocale(localeCandidate) ?? "en"
  const company = typeof body.company === "string" ? body.company.trim() : ""

  if (company.length > 0) {
    return NextResponse.json({ status: "created" }, { status: 201 })
  }

  const clientIp = getClientIp(request)
  const ipRateLimit = consumeRateLimit(
    `waitlist:ip:${clientIp}`,
    WAITLIST_RATE_LIMITS.byIp,
  )

  if (!ipRateLimit.allowed) {
    return NextResponse.json(
      { status: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipRateLimit.retryAfterSeconds),
        },
      },
    )
  }

  if (email.trim().length > 0) {
    const normalizedEmail = email.trim().toLowerCase()
    const emailRateLimit = consumeRateLimit(
      `waitlist:email:${normalizedEmail}`,
      WAITLIST_RATE_LIMITS.byEmail,
    )

    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { status: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(emailRateLimit.retryAfterSeconds),
          },
        },
      )
    }
  }

  try {
    const result = await registerPreRegistration({ email, locale })

    if (result.status === "invalid_email") {
      return NextResponse.json({ status: result.status }, { status: 400 })
    }

    if (result.status === "created") {
      return NextResponse.json({ status: result.status }, { status: 201 })
    }

    if (result.status === "created_email_pending") {
      return NextResponse.json({ status: result.status }, { status: 202 })
    }

    return NextResponse.json({ status: result.status })
  } catch (error) {
    console.error("[waitlist] Failed to create pre-registration", { error })
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
