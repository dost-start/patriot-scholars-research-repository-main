import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Supabase client for server-side storage operations.
 * Uses the service role key to bypass RLS.
 *
 * The client is created lazily so that local development using the
 * filesystem storage driver (STORAGE_DRIVER=local) does not require
 * Supabase credentials to be present.
 */

let client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.")
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.")
  }

  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return client
}
