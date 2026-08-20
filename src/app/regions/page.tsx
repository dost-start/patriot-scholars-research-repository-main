import { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Research by Region",
};

/**
 * Region index — the "Active Regions" view for the public side. Each row links
 * into the faceted search (REQ-3.1.4-2).
 */
export default async function RegionsPage() {
  const grouped = await db.paper.groupBy({
    by: ["region"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
    orderBy: { _count: { region: "desc" } },
  });

  const regions = grouped as unknown as Array<{ region: string; _count: { _all: number } }>;
  const total = regions.reduce((sum, r) => sum + r._count._all, 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-psrr-navy">Research by Region</h1>
      <p className="mt-3 font-sans text-psrr-slate">
        {total} published {total === 1 ? "paper" : "papers"} across{" "}
        {regions.length} {regions.length === 1 ? "region" : "regions"}.
      </p>

      {regions.length === 0 ? (
        <p className="mt-12 rounded-2xl border-2 border-dashed border-psrr-border p-12 text-center font-sans text-psrr-slate">
          No published research yet.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {regions.map((r) => (
            <Link
              key={r.region}
              href={`/search?region=${encodeURIComponent(r.region)}`}
              className="flex items-center justify-between rounded-2xl border border-psrr-border bg-white p-6 transition-all hover:border-psrr-navy-cta hover:shadow-sm"
            >
              <span className="flex items-center gap-3 font-display text-base font-bold text-psrr-navy">
                <MapPin className="h-4 w-4 text-psrr-gold" />
                {r.region}
              </span>
              <span className="font-sans text-sm text-psrr-slate">
                {r._count._all} {r._count._all === 1 ? "paper" : "papers"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
