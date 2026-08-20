/**
 * Email verification page.
 *
 * Better Auth redirects to this page after the user clicks the OTL link in their email.
 * The token is passed as a query param: /verify?token=...
 *
 * We also use this page as a status prompt for unverified users:
 * /verify?status=unverified — show "check your email" message
 * /verify?status=verified   — show success and sign-in link
 * /verify?status=inactive   — show "pending admin activation" message
 *
 * Next.js 16: searchParams is a Promise — must await it.
 */
import { Metadata } from "next";
import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

interface VerifyPageProps {
  searchParams: Promise<{ token?: string; status?: string }>
}

export const metadata: Metadata = {
  title: "Verify Account",
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams

  // ---------------------------------------------------------------------------
  // If a token is present, try to verify it server-side
  // ---------------------------------------------------------------------------
  if (params.token) {
    try {
      await auth.api.verifyEmail({ query: { token: params.token } })
      redirect("/verify?status=verified")
    } catch {
      return <VerifyResult status="error" />
    }
  }

  return <VerifyResult status={params.status ?? "unverified"} />
}

function VerifyResult({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <StatusCard
        icon="✅"
        title="Email verified!"
        description="Your email has been verified successfully. You can now sign in to your account."
        action={<Link href="/login" className={btnClass}>Sign in</Link>}
      />
    )
  }

  if (status === "inactive") {
    return (
      <StatusCard
        icon="⏳"
        title="Account pending activation"
        description="Your Scholar account has been verified, but it is awaiting activation by an administrator. You will receive an email once your account is activated."
        action={null}
      />
    )
  }

  if (status === "error") {
    return (
      <StatusCard
        icon="❌"
        title="Verification failed"
        description="The verification link is invalid or has expired. Please request a new one by signing in."
        action={<Link href="/login" className={btnClass}>Go to sign in</Link>}
      />
    )
  }

  // Default: unverified / just registered
  return (
    <StatusCard
      icon="📬"
      title="Check your email"
      description="We sent a verification link to your email address. Click the link to verify your account. The link expires in 24 hours."
      action={
        <Link
          href="/login"
          className="text-sm text-blue-700 hover:underline"
        >
          Back to sign in
        </Link>
      }
    />
  )
}

const btnClass =
  "inline-flex items-center justify-center rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"

function StatusCard({
  icon,
  title,
  description,
  action,
}: {
  icon: string
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-8 py-10 text-center">
        <p className="text-4xl mb-4">{icon}</p>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">{title}</h1>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        {action}
      </div>
    </div>
  )
}
