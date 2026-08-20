import { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Researchers",
};

/**
 * Directory of scholars who have at least one published paper. Only the
 * public-facing account name is shown — SPAS IDs and other PII stay encrypted
 * and admin-only.
 */
export default async function ResearchersPage() {
  const scholars = await db.user.findMany({
    where: {
      role: "SCHOLAR",
      papers: { some: { status: "PUBLISHED" } },
    },
    select: {
      id: true,
      name: true,
      scholarProfile: { select: { university: true, region: true } },
      _count: { select: { papers: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-psrr-navy">Researchers</h1>
      <p className="mt-3 font-sans text-psrr-slate">
        DOST-SEI scholars with research published in the repository.
      </p>

      {scholars.length === 0 ? (
        <p className="mt-12 rounded-2xl border-2 border-dashed border-psrr-border p-12 text-center font-sans text-psrr-slate">
          No published researchers yet.
        </p>
      ) : (
        <div className="mt-10 flex flex-col gap-4">
          {scholars.map((scholar) => (
            <Link
              key={scholar.id}
              href={`/scholar/${scholar.id}`}
              className="flex items-center justify-between rounded-2xl border border-psrr-border bg-white p-6 transition-all hover:border-psrr-navy-cta hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-psrr-navy text-sm font-bold text-white">
                  {scholar.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="font-display text-base font-bold text-psrr-navy">
                    {scholar.name}
                  </span>
                  <span className="flex items-center gap-1.5 font-sans text-xs text-psrr-slate">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {scholar.scholarProfile?.university || "University not set"}
                    {scholar.scholarProfile?.region ? ` · ${scholar.scholarProfile.region}` : ""}
                  </span>
                </div>
              </div>
              <span className="font-sans text-sm text-psrr-slate">
                {scholar._count.papers} {scholar._count.papers === 1 ? "paper" : "papers"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
