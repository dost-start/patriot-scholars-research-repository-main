import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-psrr-navy">Terms of Service</h1>

      <div className="mt-10 flex flex-col gap-8 font-sans text-[15px] leading-relaxed text-psrr-slate">
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Purpose of the repository</h2>
          <p>
            The DOST-SEI Patriot Scholars Research Repository archives and disseminates the
            theses and dissertations of DOST-SEI scholars under Open Access principles. It is
            not a peer-review journal, a thesis writing tool, or a social network.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Depositing research</h2>
          <p>
            By submitting a paper you confirm that you are an author of the work, that you have
            the right to deposit it, and that the metadata you provide is accurate. Submissions
            are reviewed by DOST-SEI staff before publication and may be returned for revision
            or rejected with a stated reason.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Using research</h2>
          <p>
            Abstracts and metadata are free to view. Downloading a full text requires an
            account, and every downloaded PDF carries a watermark identifying the account that
            requested it. Removing or obscuring a watermark, or redistributing a downloaded
            copy as your own work, is prohibited.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Accounts</h2>
          <p>
            You are responsible for keeping your credentials secure. Accounts found to be
            sharing credentials, scraping the repository, or misrepresenting scholarship status
            may be deactivated.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link
          href="/privacy"
          className="inline-flex items-center rounded-full border border-psrr-border px-6 py-3 font-display text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-surface"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
