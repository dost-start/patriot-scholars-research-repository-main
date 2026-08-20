import Link from "next/link"

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Denied",
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-psrr-white flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <p className="font-display text-8xl font-bold text-psrr-gold mb-4 opacity-20">403</p>
        <h1 className="font-display text-3xl font-bold text-psrr-navy mb-4">Access Denied</h1>
        <p className="text-psrr-slate mb-10 leading-relaxed">
          You don&apos;t have permission to access this page. This area is restricted to authorized personnel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-psrr-navy-cta px-8 py-3 text-sm font-semibold text-white hover:bg-psrr-navy transition-all active:scale-95"
          >
            Go to Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border-2 border-psrr-navy-cta px-8 py-3 text-sm font-semibold text-psrr-navy-cta hover:bg-psrr-navy-cta hover:text-white transition-all active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
