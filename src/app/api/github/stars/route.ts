import { NextResponse } from "next/server"

import { getOpenBacklogRepoStars } from "@/server/github/get-repo-stars"

export async function GET() {
  const stars = await getOpenBacklogRepoStars()

  return NextResponse.json(
    {
      stars,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  )
}
