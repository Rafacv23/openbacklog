import { sql } from "drizzle-orm"
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

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

export const games = sqliteTable(
  "games",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    igdbId: integer("igdb_id").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    summary: text("summary"),
    coverUrl: text("cover_url"),
    firstReleaseDate: integer("first_release_date", { mode: "timestamp" }),
    rating: real("rating"),
    platforms: text("platforms").notNull().default("[]"),
    genres: text("genres").notNull().default("[]"),
    checksum: text("checksum"),
    igdbUpdatedAt: integer("igdb_updated_at", { mode: "timestamp" }),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("games_igdb_id_unique").on(table.igdbId),
    uniqueIndex("games_slug_unique").on(table.slug),
    index("games_name_idx").on(table.name),
    index("games_last_synced_at_idx").on(table.lastSyncedAt),
  ],
)

export type PreRegistration = typeof preRegistrations.$inferSelect
export type NewPreRegistration = typeof preRegistrations.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert

export * from "./better-auth-schema"
