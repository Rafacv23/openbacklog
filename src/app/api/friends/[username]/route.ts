import { NextResponse } from "next/server"

import { auth } from "@/server/auth"
import { followUserByUsername, unfollowUserByUsername } from "@/server/friends/service"
import { parseUsernameCandidate } from "@/server/friends/validation"
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit"

export const runtime = "nodejs"

const FRIENDS_WRITE_RATE_LIMIT = {
  limit: 120,
  windowMs: 60 * 60 * 1_000,
} as const

type Params = {
  params: Promise<{ username: string }>
}

function parseRouteUsername(value: string): string | null {
  try {
    return parseUsernameCandidate(decodeURIComponent(value))
  } catch {
    return null
  }
}

function getRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { status: "rate_limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  )
}

function consumeFollowRateLimit(request: Request, userId: string, action: "follow" | "unfollow") {
  const clientIp = getClientIp(request)

  const byIp = consumeRateLimit(`friends:${action}:ip:${clientIp}`, FRIENDS_WRITE_RATE_LIMIT)

  if (!byIp.allowed) {
    return byIp
  }

  const byUser = consumeRateLimit(`friends:${action}:user:${userId}`, FRIENDS_WRITE_RATE_LIMIT)

  return byUser
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }

  const { username: rawUsername } = await params
  const targetUsername = parseRouteUsername(rawUsername)

  if (!targetUsername) {
    return NextResponse.json({ status: "invalid_target" }, { status: 400 })
  }

  const rateLimit = consumeFollowRateLimit(request, session.user.id, "follow")

  if (!rateLimit.allowed) {
    return getRateLimitResponse(rateLimit.retryAfterSeconds)
  }

  const result = await followUserByUsername({
    followerUserId: session.user.id,
    targetUsername,
  })

  if (result.status === "not_found") {
    return NextResponse.json({ status: "not_found" }, { status: 404 })
  }

  if (result.status === "invalid_target") {
    return NextResponse.json({ status: "invalid_target" }, { status: 400 })
  }

  return NextResponse.json({
    status: "ok",
    data: {
      following: result.following,
    },
  })
}

export async function DELETE(request: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }

  const { username: rawUsername } = await params
  const targetUsername = parseRouteUsername(rawUsername)

  if (!targetUsername) {
    return NextResponse.json({ status: "invalid_target" }, { status: 400 })
  }

  const rateLimit = consumeFollowRateLimit(request, session.user.id, "unfollow")

  if (!rateLimit.allowed) {
    return getRateLimitResponse(rateLimit.retryAfterSeconds)
  }

  const result = await unfollowUserByUsername({
    followerUserId: session.user.id,
    targetUsername,
  })

  if (result.status === "not_found") {
    return NextResponse.json({ status: "not_found" }, { status: 404 })
  }

  if (result.status === "invalid_target") {
    return NextResponse.json({ status: "invalid_target" }, { status: 400 })
  }

  return NextResponse.json({
    status: "ok",
    data: {
      following: result.following,
    },
  })
}
