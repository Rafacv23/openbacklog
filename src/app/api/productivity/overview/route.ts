import { NextResponse } from "next/server"

import { auth } from "@/server/auth"
import { getProductivityOverview } from "@/server/productivity/service"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 })
  }

  const overview = await getProductivityOverview({
    userId: session.user.id,
  })

  return NextResponse.json({
    status: "ok",
    data: overview,
  })
}
