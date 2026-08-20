/**
 * Better Auth React client.
 */
"use client"

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  user: {
    additionalFields: {
      role: {
        type: "string",
      },
      isActive: {
        type: "boolean",
      },
    },
  },
})

export const { useSession, signIn, signOut, signUp } = authClient;

export type Session = typeof authClient.$Infer.Session
