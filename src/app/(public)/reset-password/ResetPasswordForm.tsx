"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { resetPassword, type ResetPasswordResult } from "./actions"

const initialState: ResetPasswordResult | null = null

function ResetPasswordFormContent() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get("token") ?? ""

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: ResetPasswordResult | null,
      formData: FormData,
    ): Promise<ResetPasswordResult> => {
      return resetPassword({
        token: (formData.get("token") as string) || tokenFromUrl,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
      })
    },
    initialState,
  )

  if (state?.success) {
    return (
       <div className="flex w-full items-center justify-center py-20">
        <div className="w-full max-w-[420px] rounded-xl bg-psrr-white p-10 text-center shadow-[0_4px_24px_0_rgba(11,31,58,0.1)]">
          <p className="mb-4 text-4xl">✅</p>
          <h1 className="font-display text-2xl font-bold text-psrr-navy mb-2">Password Updated</h1>
          <p className="font-sans text-sm text-psrr-slate mb-8 leading-relaxed">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <a href="/login" className="flex h-12 w-full items-center justify-center rounded-full bg-psrr-navy-cta font-display text-sm font-bold text-psrr-white transition-all hover:bg-psrr-navy">
            Log in to PSRR
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center justify-center py-20">
      <div className="w-full max-w-[420px] rounded-xl bg-psrr-white p-10 shadow-[0_4px_24px_0_rgba(11,31,58,0.1)]">
        <h1 className="font-display text-2xl font-bold text-psrr-navy mb-1">Set New Password</h1>
        <p className="font-sans text-sm text-psrr-slate mb-8 leading-relaxed">
          {tokenFromUrl 
            ? "Set your new password below." 
            : "Enter the 6-digit token from your email, then set your new password."}
        </p>

        {state && !state.success && (
          <div className="mb-6 rounded-lg border border-psrr-gold/20 bg-psrr-gold/5 px-4 py-3 text-sm text-psrr-gold">
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-6">
          {!tokenFromUrl && (
            <div className="flex flex-col gap-2">
              <label htmlFor="token" className="font-sans text-sm font-bold text-psrr-navy">
                Reset Token
              </label>
              <input
                id="token"
                name="token"
                type="text"
                required
                className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
                placeholder="6-digit code"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-sans text-sm font-bold text-psrr-navy">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="font-sans text-sm font-bold text-psrr-navy">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center rounded-full bg-psrr-navy-cta font-display text-sm font-bold text-psrr-white transition-all hover:bg-psrr-navy active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20 text-psrr-slate font-sans">Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  )
}
