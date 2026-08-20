"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestPasswordReset, type ForgotPasswordResult } from "./actions"

const initialState: ForgotPasswordResult | null = null

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ForgotPasswordResult | null, formData: FormData): Promise<ForgotPasswordResult> => {
      return requestPasswordReset({ email: formData.get("email") as string })
    },
    initialState,
  )

  if (state?.success) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <div className="w-full max-w-[420px] rounded-xl bg-psrr-white p-10 text-center shadow-[0_4px_24px_0_rgba(11,31,58,0.1)]">
          <p className="mb-4 text-4xl">📬</p>
          <h1 className="font-display text-2xl font-bold text-psrr-navy mb-2">Check your email</h1>
          <p className="font-sans text-sm text-psrr-slate mb-8 leading-relaxed">
            If an account exists for that email address, we sent a password reset link.
            The link expires in 1 hour.
          </p>
          <Link href="/login" className="font-sans text-sm font-bold text-psrr-navy-cta hover:underline">
            Back to Login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center justify-center py-20">
      <div className="w-full max-w-[420px] rounded-xl bg-psrr-white p-10 shadow-[0_4px_24px_0_rgba(11,31,58,0.1)]">
        <h1 className="font-display text-2xl font-bold text-psrr-navy mb-1">Forgot Password</h1>
        <p className="font-sans text-sm text-psrr-slate mb-8 leading-relaxed">
          Enter your registered email and we&apos;ll send a reset link.
        </p>

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
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center rounded-full bg-psrr-gold font-display text-sm font-bold text-psrr-white transition-all hover:bg-psrr-gold-accent active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-8 flex justify-center">
          <Link href="/login" className="font-sans text-[13px] text-psrr-navy-cta hover:underline">
            Back to Login →
          </Link>
        </div>
      </div>
    </div>
  )
}
