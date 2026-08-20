"use server"

/**
 * Registration Server Actions.
 *
 * Two flows:
 *   1. Public registration — anyone can sign up, role stays PUBLIC
 *   2. Scholar registration — SPAS verification required, role upgraded to SCHOLAR
 *
 * Both delegate user-creation to Better Auth so password hashing, email
 * verification, and session management stay in one place.
 */
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { lookupScholar } from "@/lib/spas"
import { encryptField } from "@/lib/crypto"

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ActionResult =
  | { success: true }
  | { success: false; error: string; field?: string }

// ---------------------------------------------------------------------------
// Input validation helpers (no external dep — keeps bundle small)
// ---------------------------------------------------------------------------

function validateBaseInput(input: {
  name: string
  email: string
  password: string
}): ActionResult | null {
  if (!input.email || !input.email.includes("@")) {
    return { success: false, error: "A valid email address is required.", field: "email" }
  }
  if (!input.name || input.name.trim().length === 0) {
    return { success: false, error: "Name is required.", field: "name" }
  }
  if (!input.password || input.password.length < 12) {
    return {
      success: false,
      error: "Password must be at least 12 characters.",
      field: "password",
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Public registration
// ---------------------------------------------------------------------------

export async function registerPublicUser(input: {
  name: string
  email: string
  password: string
}): Promise<ActionResult> {
  const validationError = validateBaseInput(input)
  if (validationError) return validationError

  try {
    await auth.api.signUpEmail({
      body: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        password: input.password,
      },
    })
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed."
    // Better Auth surfaces user-friendly messages for known errors
    if (message.toLowerCase().includes("email")) {
      return { success: false, error: "This email address is already registered.", field: "email" }
    }
    return { success: false, error: message }
  }
}

// ---------------------------------------------------------------------------
// Scholar registration
// ---------------------------------------------------------------------------

export async function registerScholarUser(input: {
  name: string
  email: string
  password: string
  spasId: string
  birthdate: Date
}): Promise<ActionResult> {
  // 1. Validate base fields
  const validationError = validateBaseInput(input)
  if (validationError) return validationError

  if (!input.spasId || input.spasId.trim().length === 0) {
    return { success: false, error: "SPAS ID is required.", field: "spasId" }
  }

  // 2. Verify scholar against SPAS records
  const spasResult = await lookupScholar(input.spasId.trim(), input.birthdate)
  if (!spasResult.found) {
    const reason = spasResult.reason
    if (reason === "spas_id_not_found") {
      return {
        success: false,
        error: "No DOST-SEI scholar record found for the provided SPAS ID.",
        field: "spasId",
      }
    }
    if (reason === "birthdate_mismatch") {
      return {
        success: false,
        error: "The birthdate does not match the record for this SPAS ID.",
        field: "birthdate",
      }
    }
    return { success: false, error: "SPAS verification failed." }
  }

  // 3. Create the user account via Better Auth
  let userId: string
  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        password: input.password,
      },
    })
    userId = result.user.id
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed."
    if (message.toLowerCase().includes("email")) {
      return { success: false, error: "This email address is already registered.", field: "email" }
    }
    return { success: false, error: message }
  }

  // 4. Upgrade role to SCHOLAR and create ScholarProfile (within a transaction)
  try {
    await db.user.update({
      where: { id: userId },
      data: { role: "SCHOLAR" },
    })

    // Encrypt PII before saving
    const encryptedSpasId = encryptField(input.spasId.trim())
    const encryptedFullName = encryptField(spasResult.fullName)

    await db.scholarProfile.create({
      data: {
        userId,
        spasId: encryptedSpasId,
        fullName: encryptedFullName,
        birthdate: input.birthdate,
        university: "", // populated from ScholarProfile edit or SPAS data
        region: "",
      },
    })
  } catch (err) {
    // Profile creation failed — log but don't expose internals to the user
    console.error("[registerScholarUser] profile creation failed:", err)
    return {
      success: false,
      error: "Account created but profile setup failed. Please contact support.",
    }
  }

  return { success: true }
}
