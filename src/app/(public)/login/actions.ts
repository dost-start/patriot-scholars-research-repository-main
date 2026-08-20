"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export type LoginResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string }

export async function loginUser(input: {
  email: string
  password: string
  rememberMe?: boolean
}): Promise<LoginResult> {
  if (!input.email || !input.password) {
    return { success: false, error: "Email and password are required." }
  }

  try {
    const hdrs = await headers()
    const result = await auth.api.signInEmail({
      body: {
        email: input.email.toLowerCase().trim(),
        password: input.password,
        rememberMe: input.rememberMe ?? false,
      },
      headers: hdrs,
    })

    if (!result?.user) {
      return { success: false, error: "Invalid email or password." }
    }

    // Determine redirect based on role
    const role = (result.user as { role?: string }).role ?? "PUBLIC"
    const redirectTo =
      role === "ADMIN"
        ? "/admin"
        : role === "SCHOLAR"
          ? "/scholar"
          : "/"

    return { success: true, redirectTo }
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("credentials") ||
      message.toLowerCase().includes("unauthorized")
    ) {
      return { success: false, error: "Invalid email or password." }
    }
    throw err
  }
}
