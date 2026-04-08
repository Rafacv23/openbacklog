import { asc, eq, inArray } from "drizzle-orm"

import { db } from "@/server/db"
import { preRegistrations } from "@/server/db/schema"
import { sendWaitlistLaunchEmail } from "@/server/email/send-waitlist-launch-email"

const SEND_CONCURRENCY = 10

function splitIntoChunks<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }

  return chunks
}

export type SendLaunchAnnouncementResult = {
  failed: number
  failedEmails: string[]
  sent: number
  totalEligible: number
}

export async function sendLaunchAnnouncementToRegisteredUsers(): Promise<SendLaunchAnnouncementResult> {
  const pendingRegistrations = await db
    .select({
      id: preRegistrations.id,
      email: preRegistrations.email,
    })
    .from(preRegistrations)
    .where(eq(preRegistrations.notificationSent, false))
    .orderBy(asc(preRegistrations.id))

  const failedEmails: string[] = []
  let sent = 0

  for (const chunk of splitIntoChunks(pendingRegistrations, SEND_CONCURRENCY)) {
    const settledChunk = await Promise.allSettled(
      chunk.map((entry) => sendWaitlistLaunchEmail({ email: entry.email })),
    )

    const sentIds: number[] = []

    settledChunk.forEach((result, index) => {
      const entry = chunk[index]

      if (!entry) {
        return
      }

      if (result.status === "fulfilled") {
        sent += 1
        sentIds.push(entry.id)
        return
      }

      failedEmails.push(entry.email)
      console.error("[waitlist] Failed launch email", {
        email: entry.email,
        error: result.reason,
      })
    })

    if (sentIds.length > 0) {
      await db
        .update(preRegistrations)
        .set({ notificationSent: true })
        .where(inArray(preRegistrations.id, sentIds))
    }
  }

  return {
    totalEligible: pendingRegistrations.length,
    sent,
    failed: failedEmails.length,
    failedEmails,
  }
}
