import { NextResponse } from "next/server"

import { auth } from "@/server/auth"
import {
  addGameToLibrary,
  getUserLibrary,
} from "@/server/library/service"
import { parseLibraryState } from "@/server/library/states"
import { parseOptionalLibraryState } from "@/server/library/validation"
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit"

export const runtime = "nodejs"

const LIBRARY_WRITE_RATE_LIMIT = {
  limit: 80,
  windowMs: 60 * 60 * 1_000,
} as const

type CreateLibraryEntryBody = {
  gameIgdbId?: unknown
  state?: unknown
}

function parseGameIgdbId(value: unknown): number | null {
  const parsed =
    typeof value === "string" && /^\d+$/.test(value)
      ? Number(value)
      : typeof value === "number"
        ? value
        : Number.NaN

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const rawState = url.searchParams.get("state")

  if (rawState && !parseOptionalLibraryState(rawState)) {
    return NextResponse.json({ status: "invalid_state" }, { status: 400 })
  }

  const result = await getUserLibrary({
    userId: session.user.id,
    page: url.searchParams.get("page"),
    search: url.searchParams.get("search"),
    sort: url.searchParams.get("sort"),
    state: rawState,
  })

  return NextResponse.json({
    status: "ok",
    data: result,
  })
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }

  const clientIp = getClientIp(request)
  const byIp = consumeRateLimit(`library:create:ip:${clientIp}`, LIBRARY_WRITE_RATE_LIMIT)

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
    `library:create:user:${session.user.id}`,
    LIBRARY_WRITE_RATE_LIMIT,
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

  let body: CreateLibraryEntryBody

  try {
    body = (await request.json()) as CreateLibraryEntryBody
  } catch {
    return NextResponse.json({ status: "invalid_payload" }, { status: 400 })
  }

  const gameIgdbId = parseGameIgdbId(body.gameIgdbId)
  const state = parseLibraryState(body.state)

  if (!gameIgdbId || !state) {
    return NextResponse.json({ status: "invalid_payload" }, { status: 400 })
  }

  const item = await addGameToLibrary({
    userId: session.user.id,
    gameIgdbId,
    state,
  })

  if (!item) {
    return NextResponse.json({ status: "invalid_game" }, { status: 404 })
  }

  return NextResponse.json({
    status: "ok",
    data: item,
  })
}
