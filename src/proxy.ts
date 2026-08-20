/**
 * Next.js route-protection proxy.
 *
 * Runs on every request matched by `config.matcher`.
 * Reads the Better Auth session, calls getAuthDecision() for the route
 * protection decision, and redirects when necessary.
 *
 * NOTE: Next.js 16 proxy runs in the Node.js runtime by default.
 * Better Auth's getSession() works fine here.
 */
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAuthDecision, type SessionInfo } from "@/lib/auth-decisions"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Read the Better Auth session from the incoming request cookies / headers
  let session: SessionInfo | null = null
  try {
    const raw = await auth.api.getSession({ headers: request.headers })
    if (raw?.user) {
      session = {
        userId: raw.user.id,
        role: (raw.user as { role?: string }).role as SessionInfo["role"] ?? "PUBLIC",
        isActive: (raw.user as { isActive?: boolean }).isActive ?? false,
        emailVerified: raw.user.emailVerified,
      }
    }
  } catch {
    // If session reading fails (e.g., invalid token), treat as unauthenticated
    session = null
  }

  const decision = getAuthDecision(pathname, session)

  if (decision.action === "redirect") {
    const url = request.nextUrl.clone()
    url.pathname = decision.to
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (Next.js static files)
     * - _next/image (Next.js image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public asset files
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot)$).*)",
  ],
}
