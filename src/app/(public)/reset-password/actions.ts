"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export type ResetPasswordResult =
  | { success: true }
  | { success: false; error: string }

export async function resetPassword(input: {
  token: string
  password: string
  confirmPassword: string
}): Promise<ResetPasswordResult> {
  if (!input.password || input.password.length < 12) {
    return { success: false, error: "Password must be at least 12 characters." }
  }
  if (input.password !== input.confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }
  if (!input.token) {
    return { success: false, error: "Reset token is missing. Please request a new link." }
  }

  try {
    await auth.api.resetPassword({
      body: { token: input.token, newPassword: input.password },
    })
    redirect("/login?reset=success")
  } catch (err) {
    // Let redirect() propagate
    const message = err instanceof Error ? err.message : ""
    if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("invalid")) {
      return {
        success: false,
        error: "This reset link has expired or is invalid. Please request a new one.",
      }
    }
    throw err
  }
}
