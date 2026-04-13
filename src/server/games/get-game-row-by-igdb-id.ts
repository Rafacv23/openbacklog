import { eq } from "drizzle-orm"

import { db } from "@/server/db"
import { games } from "@/server/db/schema"
import { getGameByIgdbId } from "@/server/games/get-game-by-id"

export async function getGameRowByIgdbId(igdbId: number) {
  if (!Number.isInteger(igdbId) || igdbId <= 0) {
    return null
  }

  const existingRows = await db
    .select()
    .from(games)
    .where(eq(games.igdbId, igdbId))
    .limit(1)

  if (existingRows[0]) {
    return existingRows[0]
  }

  await getGameByIgdbId(igdbId)

  const syncedRows = await db
    .select()
    .from(games)
    .where(eq(games.igdbId, igdbId))
    .limit(1)

  return syncedRows[0] ?? null
}
