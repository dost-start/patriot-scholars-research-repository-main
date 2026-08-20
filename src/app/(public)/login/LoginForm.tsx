"use client"

import { useActionState, useEffect } from "react"
import Link from "next/link"
import { loginUser, type LoginResult } from "./actions"

const initialState: LoginResult | null = null

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: LoginResult | null, formData: FormData) => {    
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      const rememberMe = formData.get("rememberMe") === "on"      
      return loginUser({ email, password, rememberMe })
    },
    initialState,
  )

  useEffect(() => {
    if (state?.success) {
      window.location.href = state.redirectTo
    }
  }, [state])

  return (
    <div className="flex w-full items-center justify-center py-20">
      <div className="w-full max-w-[480px] rounded-xl bg-psrr-white p-8 shadow-[0_4px_24px_0_rgba(11,31,58,0.08)] lg:p-12">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold text-psrr-navy">Welcome back</h1>
          <p className="font-sans text-base text-psrr-slate">Sign in to your PSRR account.</p>
        </div>

        {state && !state.success && (
          <div className="mb-6 rounded-lg border border-psrr-gold/20 bg-psrr-gold/5 px-4 py-3 text-sm text-psrr-gold">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-sans text-sm font-bold text-psrr-navy">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
              placeholder="you@email.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="font-sans text-sm font-bold text-psrr-navy">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="font-sans text-sm font-bold text-psrr-gold hover:text-psrr-gold-accent"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-psrr-border text-psrr-navy-cta focus:ring-psrr-navy-cta"
            />
            <label htmlFor="rememberMe" className="font-sans text-sm text-psrr-slate">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-psrr-navy-cta font-display text-base font-bold text-psrr-white transition-all hover:bg-psrr-navy active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 flex justify-center gap-2 text-sm">
          <span className="font-sans text-psrr-slate">Don&apos;t have an account?</span>
          <Link href="/register" className="font-sans font-bold text-psrr-navy-cta hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  )
}
