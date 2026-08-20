import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "About",
};

export default async function AboutPage() {
  const [papers, scholars, downloads] = await Promise.all([
    db.paper.count({ where: { status: "PUBLISHED" } }),
    db.user.count({ where: { role: "SCHOLAR", isActive: true } }),
    db.download.count(),
  ]);

  const stats = [
    { label: "Published papers", value: papers },
    { label: "Verified scholars", value: scholars },
    { label: "Full-text downloads", value: downloads },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-psrr-navy">About the Repository</h1>

      <div className="mt-10 flex flex-col gap-8 font-sans text-[15px] leading-relaxed text-psrr-slate">
        <p>
          The DOST-SEI Patriot Scholars Research Repository is a centralized platform for the
          research output of scholars of the Department of Science and Technology - Science
          Education Institute. It exists so that knowledge produced with public funding stays
          available to the Filipino public.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-psrr-border bg-white p-6">
              <p className="font-display text-3xl font-bold text-psrr-navy">{stat.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-psrr-slate">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Who can do what</h2>
          <p>
            Verified scholars deposit their theses and dissertations. Registered readers search
            the collection and download watermarked full texts. Anyone, signed in or not, can
            read titles, metadata, and abstracts. DOST-SEI staff review each submission before
            it is published.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Open access</h2>
          <p>
            Every published paper is free to read. Downloads are tracked and watermarked to
            protect the intellectual property of the scholars who contributed the work.
          </p>
        </section>
      </div>

      <div className="mt-12 flex gap-4">
        <Link
          href="/search"
          className="inline-flex items-center rounded-full bg-psrr-navy-cta px-6 py-3 font-display text-sm font-bold text-white transition-all hover:bg-psrr-navy"
        >
          Browse Research
        </Link>
        <Link
          href="/regions"
          className="inline-flex items-center rounded-full border border-psrr-border px-6 py-3 font-display text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-surface"
        >
          Browse by Region
        </Link>
      </div>
    </div>
  );
}
