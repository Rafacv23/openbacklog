import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"

import * as schema from "./schema"

const databaseUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!databaseUrl) {
  throw new Error("Missing TURSO_DATABASE_URL")
}

if (!authToken) {
  throw new Error("Missing TURSO_AUTH_TOKEN")
}

const client = createClient({
  url: databaseUrl,
  authToken,
})

export const db = drizzle(client, { schema })
