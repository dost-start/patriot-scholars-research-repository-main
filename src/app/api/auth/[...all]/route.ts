/**
 * Better Auth catch-all route handler.
 *
 * All /api/auth/* requests are handled here — sign in, sign up, session,
 * verify email, reset password, CSRF, etc.
 *
 * toNextJsHandler wraps auth.handler so it exports all required HTTP verbs.
 */
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth.handler)
