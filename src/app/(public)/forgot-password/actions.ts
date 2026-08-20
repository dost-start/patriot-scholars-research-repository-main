"use server"

import { auth } from "@/lib/auth"

export type ForgotPasswordResult =
  | { success: true }
  | { success: false; error: string }

export async function requestPasswordReset(input: {
  email: string
}): Promise<ForgotPasswordResult> {
  if (!input.email || !input.email.includes("@")) {
    return { success: false, error: "A valid email address is required." }
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email: input.email.toLowerCase().trim(), redirectTo: "/reset-password" },
    })
    // Always return success to avoid email enumeration
    return { success: true }
  } catch {
    // Still return success — we never reveal whether the email exists
    return { success: true }
  }
}
