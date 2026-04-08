import { NextResponse } from "next/server"

import { toSupportedLocale } from "@/lib/locales"
import { submitRoadmapSuggestion } from "@/server/roadmap/submit-roadmap-suggestion"
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit"

type CreateRoadmapSuggestionRequestBody = {
  company?: unknown
  email?: unknown
  locale?: unknown
  message?: unknown
  title?: unknown
}

export const runtime = "nodejs"

const ROADMAP_RATE_LIMITS = {
  byEmail: {
    limit: 8,
    windowMs: 60 * 60 * 1000,
  },
  byIp: {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  },
} as const

export async function POST(request: Request) {
  let body: CreateRoadmapSuggestionRequestBody

  try {
    body = (await request.json()) as CreateRoadmapSuggestionRequestBody
  } catch {
    return NextResponse.json({ status: "invalid_payload" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email : ""
  const title = typeof body.title === "string" ? body.title : ""
  const message = typeof body.message === "string" ? body.message : ""
  const localeCandidate = typeof body.locale === "string" ? body.locale : "en"
  const locale = toSupportedLocale(localeCandidate) ?? "en"
  const company = typeof body.company === "string" ? body.company.trim() : ""

  if (company.length > 0) {
    return NextResponse.json({ status: "created" }, { status: 201 })
  }

  const clientIp = getClientIp(request)
  const ipRateLimit = consumeRateLimit(
    `roadmap:ip:${clientIp}`,
    ROADMAP_RATE_LIMITS.byIp,
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
      `roadmap:email:${normalizedEmail}`,
      ROADMAP_RATE_LIMITS.byEmail,
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
    const result = await submitRoadmapSuggestion({
      email,
      locale,
      message,
      title,
    })

    if (result.status === "invalid_email" || result.status === "invalid_payload") {
      return NextResponse.json({ status: result.status }, { status: 400 })
    }

    if (result.status === "created") {
      return NextResponse.json({ status: result.status }, { status: 201 })
    }

    if (result.status === "created_email_pending") {
      return NextResponse.json({ status: result.status }, { status: 202 })
    }

    return NextResponse.json({ status: "error" }, { status: 500 })
  } catch (error) {
    console.error("[roadmap] Failed to submit roadmap suggestion", { error })
    return NextResponse.json({ status: "error" }, { status: 500 })
  }
}
