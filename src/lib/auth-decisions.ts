/**
 * Pure route-authorization decision logic.
 *
 * Extracted from middleware so it can be unit-tested without Next.js.
 * The actual middleware in src/middleware.ts delegates to this function.
 */

export type Role = "PUBLIC" | "SCHOLAR" | "ADMIN"

export interface SessionInfo {
  userId: string
  role: Role
  isActive: boolean
  emailVerified: boolean
}

export type AuthDecision =
  | { action: "allow" }
  | { action: "redirect"; to: string }

/**
 * Decide what to do for a given path + session combination.
 *
 * Rules:
 * - /api/*             → always allow (route handlers protect themselves)
 * - /admin/*           → must be ADMIN; else → /login or /403
 * - /scholar/*         → must be SCHOLAR or ADMIN and isActive; else → /login or /403
 * - /login, /register  → redirect logged-in users to their home page
 * - everything else    → allow
 */
export function getAuthDecision(
  pathname: string,
  session: SessionInfo | null,
): AuthDecision {
  const allow: AuthDecision = { action: "allow" }

  // Always allow API routes — they handle their own authorization
  if (pathname.startsWith("/api/")) return allow

  // -------------------------------------------------------------------------
  // Admin routes
  // -------------------------------------------------------------------------
  if (pathname.startsWith("/admin")) {
    if (!session) return { action: "redirect", to: "/login" }
    if (session.role !== "ADMIN") return { action: "redirect", to: "/403" }
    return allow
  }

  // -------------------------------------------------------------------------
  // Scholar routes
  // -------------------------------------------------------------------------
  if (pathname.startsWith("/scholar")) {
    if (!session) return { action: "redirect", to: "/login" }
    const canAccess =
      (session.role === "SCHOLAR" && session.isActive) || session.role === "ADMIN"
    if (!canAccess) return { action: "redirect", to: "/403" }
    return allow
  }

  // -------------------------------------------------------------------------
  // Auth pages: redirect away if already logged in
  // -------------------------------------------------------------------------
  if (pathname === "/login" || pathname === "/register") {
    if (!session) return allow

    if (session.role === "ADMIN") return { action: "redirect", to: "/admin" }
    if (session.role === "SCHOLAR" && session.isActive)
      return { action: "redirect", to: "/scholar" }

    // PUBLIC or inactive SCHOLAR → send to home page
    return { action: "redirect", to: "/" }
  }

  return allow
}
