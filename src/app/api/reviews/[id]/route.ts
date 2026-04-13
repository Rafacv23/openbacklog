import { NextResponse } from "next/server"

import { auth } from "@/server/auth"
import { getPublicReviewById } from "@/server/reviews/service"
import { upsertReviewForGame } from "@/server/reviews/service"
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit"

export const runtime = "nodejs"

type Params = {
  params: Promise<{ id: string }>
}

type UpsertReviewBody = {
  body?: unknown
  recommend?: unknown
  platformPlayed?: unknown
  hoursToComplete?: unknown
}

const REVIEW_WRITE_RATE_LIMIT = {
  limit: 80,
  windowMs: 60 * 60 * 1_000,
} as const

function parseReviewId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export async function GET(_: Request, { params }: Params) {
  const { id: rawId } = await params
  const id = parseReviewId(rawId)

  if (!id) {
    return NextResponse.json({ status: "invalid_review" }, { status: 400 })
  }

  const review = await getPublicReviewById(id)

  if (!review) {
    return NextResponse.json({ status: "not_found" }, { status: 404 })
  }

  return NextResponse.json({
    status: "ok",
    data: review,
  })
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }

  const { id: rawGameId } = await params
  const gameIgdbId = parseReviewId(rawGameId)

  if (!gameIgdbId) {
    return NextResponse.json({ status: "invalid_game" }, { status: 400 })
  }

  const clientIp = getClientIp(request)
  const byIp = consumeRateLimit(`review:write:ip:${clientIp}`, REVIEW_WRITE_RATE_LIMIT)

  if (!byIp.allowed) {
    return NextResponse.json(
      { status: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(byIp.retryAfterSeconds),
        },
      },
    )
  }

  const byUser = consumeRateLimit(
    `review:write:user:${session.user.id}`,
    REVIEW_WRITE_RATE_LIMIT,
  )

  if (!byUser.allowed) {
    return NextResponse.json(
      { status: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(byUser.retryAfterSeconds),
        },
      },
    )
  }

  let body: UpsertReviewBody

  try {
    body = (await request.json()) as UpsertReviewBody
  } catch {
    return NextResponse.json({ status: "invalid_payload" }, { status: 400 })
  }

  const result = await upsertReviewForGame({
    userId: session.user.id,
    gameIgdbId,
    body: body.body,
    recommend: body.recommend,
    platformPlayed: body.platformPlayed,
    hoursToComplete: body.hoursToComplete,
  })

  if (result.status === "invalid_game") {
    return NextResponse.json({ status: result.status }, { status: 404 })
  }

  if (result.status === "invalid_payload" || result.status === "invalid_platform") {
    return NextResponse.json({ status: result.status }, { status: 400 })
  }

  return NextResponse.json({
    status: "ok",
    data: result.review,
  })
}
