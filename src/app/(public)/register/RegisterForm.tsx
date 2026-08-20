"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { registerPublicUser, registerScholarUser, type ActionResult } from "./actions"

const initialState: ActionResult | null = null

function AlertInfo({ message }: { message: string }) {
  return (
    <div className="flex w-full items-start gap-3 rounded-lg border-l-4 border-psrr-navy-cta bg-[#F7F9FC] p-4 shadow-sm">
      <div className="mt-0.5 h-5 w-5 shrink-0 text-psrr-navy-cta">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="font-sans text-xs leading-relaxed text-psrr-slate">
        {message}
      </p>
    </div>
  )
}

function PublicRegistrationForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
      return registerPublicUser({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      })
    },
    initialState,
  )

  if (state?.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="mb-1 font-sans font-bold text-green-800">Account created!</p>
        <p className="font-sans text-sm text-green-700">
          Check your email for a verification link to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state && !state.success && (
        <div className="rounded-lg border border-psrr-gold/20 bg-psrr-gold/5 px-4 py-3 text-sm text-psrr-gold">
          {state.error}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="pub-name" className="font-sans text-sm font-bold text-psrr-navy">
          Full Name
        </label>
        <input
          id="pub-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
          placeholder="Juan dela Cruz"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="pub-email" className="font-sans text-sm font-bold text-psrr-navy">
          Email Address
        </label>
        <input
          id="pub-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
          placeholder="you@email.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="pub-password" className="font-sans text-sm font-bold text-psrr-navy">
          Password <span className="font-normal text-psrr-slate-light">(min. 12 characters)</span>
        </label>
        <input
          id="pub-password"
          name="password"
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
        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-psrr-navy-cta font-display text-base font-bold text-psrr-white transition-all hover:bg-psrr-navy active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  )
}

function ScholarRegistrationForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData): Promise<ActionResult> => {
      return registerScholarUser({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        spasId: formData.get("spasId") as string,
        birthdate: new Date(formData.get("birthdate") as string), 
      })
    },
    initialState,
  )

  if (state?.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="mb-1 font-sans font-bold text-green-800">Scholar account created!</p>
        <p className="font-sans text-sm text-green-700">
          Check your email to verify your account. An administrator will also need to
          activate your Scholar access before you can upload papers.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state && !state.success && (
        <div className="rounded-lg border border-psrr-gold/20 bg-psrr-gold/5 px-4 py-3 text-sm text-psrr-gold">
          {state.error}
        </div>
      )}
      
      <AlertInfo message="Your SPAS ID, full name, and birthdate will be validated against the official DOST-SEI scholarship database." />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2 flex flex-col gap-2">
          <label htmlFor="sch-name" className="font-sans text-sm font-bold text-psrr-navy">
            Full Name
          </label>
          <input
            id="sch-name"
            name="name"
            type="text"
            required
            className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
            placeholder="Juan dela Cruz"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sch-spasId" className="font-sans text-sm font-bold text-psrr-navy">
            SPAS ID
          </label>
          <input
            id="sch-spasId"
            name="spasId"
            type="text"
            required
            className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
            placeholder="SPAS-2019-XXXXX"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sch-birthdate" className="font-sans text-sm font-bold text-psrr-navy">
            Date of Birth
          </label>
          <input
            id="sch-birthdate"
            name="birthdate"
            type="date"
            required
            className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="sch-email" className="font-sans text-sm font-bold text-psrr-navy">
          Email Address
        </label>
        <input
          id="sch-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
          placeholder="you@email.com"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="sch-password" className="font-sans text-sm font-bold text-psrr-navy">
          Password <span className="font-normal text-psrr-slate-light">(min. 12 characters)</span>
        </label>
        <input
          id="sch-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
          placeholder="••••••••"
        />
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-1 h-4 w-4 shrink-0 rounded border-2 border-psrr-gold bg-transparent" />
        <p className="font-sans text-[13px] leading-snug text-psrr-slate">
          I have read and agree to the Data Privacy Act (RA 10173) terms.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-psrr-gold font-display text-base font-bold text-psrr-white transition-all hover:bg-psrr-gold-accent active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Verifying SPAS ID..." : "Verify & Create Account"}
      </button>
    </form>
  )
}

export default function RegisterForm() {
  const [tab, setTab] = useState<"public" | "scholar">("scholar")  

  return (
    <div className="flex w-full items-center justify-center py-20">
      <div className="w-full max-w-[600px] rounded-xl bg-psrr-white p-8 shadow-[0_4px_24px_0_rgba(11,31,58,0.08)] lg:p-12">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold text-psrr-navy">Create Account</h1>
          <p className="font-sans text-base text-psrr-slate">Join PSRR to access and submit research.</p>
        </div>

        {/* Tab switcher */}
        <div className="mb-8 flex gap-8 border-b border-psrr-border">
          <button
            type="button"
            onClick={() => setTab("scholar")}
            className={`pb-3 font-display text-sm font-bold transition-all ${
              tab === "scholar"
                ? "border-b-2 border-psrr-navy-cta text-psrr-navy-cta"
                : "text-psrr-slate hover:text-psrr-navy"
            }`}
          >
            DOST-SEI Scholar
          </button>
          <button
            type="button"
            onClick={() => setTab("public")}
            className={`pb-3 font-display text-sm font-bold transition-all ${
              tab === "public"
                ? "border-b-2 border-psrr-navy-cta text-psrr-navy-cta"
                : "text-psrr-slate hover:text-psrr-navy"
            }`}
          >
            Public User
          </button>
        </div>

        {tab === "public" ? <PublicRegistrationForm /> : <ScholarRegistrationForm />}

        <div className="mt-8 flex justify-center gap-2 text-sm">
          <span className="font-sans text-psrr-slate">Already have an account?</span>
          <Link href="/login" className="font-sans font-bold text-psrr-navy-cta hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
