import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

/**
 * Data Privacy Act (RA 10173) notice. Registration links here from the
 * consent checkbox (REQ-3.2.2-1), so the terms a user agrees to are readable
 * before they agree to them.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-psrr-navy">Privacy Policy</h1>
      <p className="mt-3 font-sans text-sm text-psrr-slate">
        Data Privacy Act of 2012 (Republic Act No. 10173)
      </p>

      <div className="mt-10 flex flex-col gap-8 font-sans text-[15px] leading-relaxed text-psrr-slate">
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">What we collect</h2>
          <p>
            When you register we collect your full name, email address, and — for DOST-SEI
            scholars — your SPAS ID and birthdate. When you submit research we collect the
            paper metadata you provide and the PDF file itself. When you download a paper we
            record who downloaded it and when.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Why we collect it</h2>
          <p>
            Scholar identity data is used solely to verify DOST-SEI scholarship status against
            official records. Download records support usage analytics and the watermarking
            that protects the intellectual property of contributing scholars.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">How we protect it</h2>
          <p>
            Personally identifiable information — SPAS IDs and scholar names — is encrypted at
            rest using AES-256-GCM. All traffic is served over HTTPS. Every administrator action
            that reads or changes scholar personal data is written to an immutable audit log.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">How long we keep it</h2>
          <p>
            User and access logs are retained for a minimum of one year. Research PDFs are
            retained indefinitely as part of the national research record, in line with
            National Archives of the Philippines standards for digital records, unless a
            takedown request is processed.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Your rights</h2>
          <p>
            Under RA 10173 you may request access to, correction of, or erasure of your
            personal data, and you may object to its processing. To exercise any of these
            rights, or to file a takedown request for a deposited paper, contact the DOST-SEI
            Scholarship Division.
          </p>
        </section>
      </div>

      <div className="mt-12 flex gap-4">
        <Link
          href="/register"
          className="inline-flex items-center rounded-full bg-psrr-navy-cta px-6 py-3 font-display text-sm font-bold text-white transition-all hover:bg-psrr-navy"
        >
          Back to Registration
        </Link>
        <Link
          href="/terms"
          className="inline-flex items-center rounded-full border border-psrr-border px-6 py-3 font-display text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-surface"
        >
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
