import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const preRegistrations = sqliteTable("pre_registrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  registeredAt: integer("registered_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  notificationSent: integer("notification_sent", { mode: "boolean" })
    .notNull()
    .default(false),
})

export type PreRegistration = typeof preRegistrations.$inferSelect
export type NewPreRegistration = typeof preRegistrations.$inferInsert
