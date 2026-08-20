/**
 * Better Auth server configuration.
 *
 * This file is the single source of truth for auth behaviour.
 * It must only be imported in server contexts (API routes, Server Actions,
 * middleware). Never import it in client components.
 *
 * Docs: https://better-auth.com
 */
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { db } from "./db"
import { sendVerificationEmail, sendPasswordResetEmail } from "./mailer"

export const auth = betterAuth({
  appName: "DOST-SEI Patriot Scholars Research Repository",

  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,

  secret: process.env.BETTER_AUTH_SECRET,

  // ---------------------------------------------------------------------------
  // Database — Prisma adapter (PostgreSQL via Supabase)
  // ---------------------------------------------------------------------------
  database: prismaAdapter(db, { provider: "postgresql" }),

  // ---------------------------------------------------------------------------
  // Email + Password authentication
  // ---------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    // Don't auto-sign-in until the user has verified their email
    autoSignIn: false,

    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url)
    },
  },

  // ---------------------------------------------------------------------------
  // Email verification (OTL link)
  // ---------------------------------------------------------------------------
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url)
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    // REQ-3.1.1-3 / REQ-3.1.2-2: the One-Time Link is what activates an
    // account. Scholars are already SPAS-verified at registration, so no
    // manual admin step stands between verification and access.
    afterEmailVerification: async (user) => {
      await db.user.update({
        where: { id: user.id },
        data: { isActive: true },
      })
    },
    // Token is valid for 24 hours
    expiresIn: 60 * 60 * 24,
  },

  // ---------------------------------------------------------------------------
  // User model — declare additional fields so Better Auth infers them in types
  // ---------------------------------------------------------------------------
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "PUBLIC",
        required: false,
        returned: true,
        input: false, // role is never set by the client on sign-up
      },
      isActive: {
        type: "boolean",
        defaultValue: false,
        required: false,
        returned: true,
        input: false,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Plugins
  // ---------------------------------------------------------------------------
  plugins: [
    // nextCookies must be last so it can intercept Set-Cookie on all responses
    nextCookies(),
  ],
})

/**
 * Inferred auth type — use this to type Server Action / middleware helpers.
 */
export type Auth = typeof auth
