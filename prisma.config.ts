/**
 * Prisma 7 configuration.
 *
 * The Prisma CLI does not load .env.local (that is a Next.js convention).
 * We parse it here manually so `npx prisma db push / migrate` just works
 * without any extra environment setup.
 */
import { defineConfig } from "prisma/config"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

const envPath = resolve(process.cwd(), ".env.local")
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8")
    .replace(/\r\n/g, "\n") // normalise Windows line endings
    .split("\n")

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue // skip blanks + comments

    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue

    const key = trimmed.substring(0, eqIdx).trim()
    let value = trimmed.substring(eqIdx + 1).trim()

    // Strip surrounding single or double quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI operations (db push, migrate) must use the direct connection —
    // the PgBouncer pooler (DATABASE_URL) causes "prepared statement already
    // exists" errors. The runtime client (src/lib/db.ts) uses DATABASE_URL.
    url: process.env.DIRECT_URL!,
  },
})
