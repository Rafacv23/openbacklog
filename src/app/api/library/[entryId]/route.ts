import { NextResponse } from "next/server"

import { auth } from "@/server/auth"
import { updateLibraryEntryState } from "@/server/library/service"
import { parseLibraryState } from "@/server/library/states"
import { consumeRateLimit, getClientIp } from "@/server/security/rate-limit"

export const runtime = "nodejs"

const LIBRARY_UPDATE_RATE_LIMIT = {
  limit: 120,
  windowMs: 60 * 60 * 1_000,
} as const

type UpdateLibraryEntryBody = {
  state?: unknown
}

type Params = {
  params: Promise<{ entryId: string }>
}

function parseEntryId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null
  }

  return parsedValue
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }

  const { entryId: rawEntryId } = await params
  const entryId = parseEntryId(rawEntryId)

  if (!entryId) {
    return NextResponse.json({ status: "invalid_entry" }, { status: 400 })
  }

  const clientIp = getClientIp(request)
  const byIp = consumeRateLimit(`library:update:ip:${clientIp}`, LIBRARY_UPDATE_RATE_LIMIT)

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
    `library:update:user:${session.user.id}`,
    LIBRARY_UPDATE_RATE_LIMIT,
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

  let body: UpdateLibraryEntryBody

  try {
    body = (await request.json()) as UpdateLibraryEntryBody
  } catch {
    return NextResponse.json({ status: "invalid_payload" }, { status: 400 })
  }

  const state = parseLibraryState(body.state)

  if (!state) {
    return NextResponse.json({ status: "invalid_payload" }, { status: 400 })
  }

  const updated = await updateLibraryEntryState({
    entryId,
    state,
    userId: session.user.id,
  })

  if (!updated) {
    return NextResponse.json({ status: "not_found" }, { status: 404 })
  }

  return NextResponse.json({
    status: "ok",
    data: updated,
  })
}
