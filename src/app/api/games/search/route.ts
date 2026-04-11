import { NextResponse } from "next/server"

import { auth } from "@/server/auth"
import { searchGames } from "@/server/games/search-games"
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit"

export const runtime = "nodejs"

const SEARCH_RATE_LIMIT = {
  limit: 120,
  windowMs: 60 * 60 * 1_000,
} as const

function parseLimit(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return undefined
  }

  return parsedValue
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json(
      {
        status: "unauthorized",
      },
      { status: 401 },
    )
  }

  const url = new URL(request.url)
  const query = (url.searchParams.get("query") ?? "").trim()
  const limit = parseLimit(url.searchParams.get("limit"))

  if (query.length < 2) {
    return NextResponse.json(
      {
        status: "invalid_query",
      },
      { status: 400 },
    )
  }

  const clientIp = getClientIp(request)
  const rateLimit = consumeRateLimit(`games:search:ip:${clientIp}`, SEARCH_RATE_LIMIT)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { status: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    )
  }

  try {
    const results = await searchGames(query, limit)

    return NextResponse.json(
      {
        status: "ok",
        data: results,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      },
    )
  } catch (error) {
    console.error("[games] Failed to search games", { error, query })

    return NextResponse.json(
      { status: "error" },
      {
        status: 500,
      },
    )
  }
}
