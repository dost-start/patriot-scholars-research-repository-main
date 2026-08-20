/**
 * Prisma client singleton.
 *
 * Prisma 7 uses the "client" engine which requires an explicit database
 * adapter. We use @prisma/adapter-pg with the PgBouncer-compatible pooler
 * URL (DATABASE_URL) for runtime queries.
 *
 * In development, Next.js hot-reload would create a new module instance on
 * every file save, exhausting the connection pool. We cache the client on
 * `globalThis` so only one instance ever exists per process.
 */
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
