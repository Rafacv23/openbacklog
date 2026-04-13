import { sql } from "drizzle-orm"
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"
import { user } from "./better-auth-schema"

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

export const libraryEntries = sqliteTable(
  "library_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    state: text("state").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("library_entries_user_game_unique").on(table.userId, table.gameId),
    index("library_entries_user_idx").on(table.userId),
    index("library_entries_state_idx").on(table.state),
    index("library_entries_updated_at_idx").on(table.updatedAt),
  ],
)

export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    recommend: integer("recommend", { mode: "boolean" }).notNull(),
    platformPlayed: text("platform_played"),
    hoursToComplete: integer("hours_to_complete"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("reviews_user_game_unique").on(table.userId, table.gameId),
    index("reviews_user_idx").on(table.userId),
    index("reviews_game_idx").on(table.gameId),
    index("reviews_updated_at_idx").on(table.updatedAt),
  ],
)

export type PreRegistration = typeof preRegistrations.$inferSelect
export type NewPreRegistration = typeof preRegistrations.$inferInsert
export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
export type LibraryEntry = typeof libraryEntries.$inferSelect
export type NewLibraryEntry = typeof libraryEntries.$inferInsert
export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert

export * from "./better-auth-schema"
