import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, BarChart3, PieChart, Download, Users, FileText, TrendingUp } from "lucide-react";

import { Metadata } from "next";

interface FieldStat {
  fieldOfStudy: string;
  _count: {
    fieldOfStudy: number;
    _all: number;
  };
}

interface RegionStat {
  region: string;
  _count: {
    region: number;
    _all: number;
  };
}

interface PaperWithDetails {
  id: string;
  title: string;
  fieldOfStudy: string;
  uploader: {
    name: string;
  };
  _count: {
    downloads: number;
  };
}

interface StatusStat {
  status: string;
  _count: {
    status: number;
    _all: number;
  };
}

export const metadata: Metadata = {
  title: "Analytics Detail",
};

export default async function AdminAnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  // Get data for breakdowns
  const [
    fieldStatsResult,
    regionStatsResult,
    topDownloadedResult,
    statusStatsResult,
    monthlyStats
  ] = await Promise.all([
    db.paper.groupBy({
      by: ["fieldOfStudy"],
      _count: { _all: true },
      orderBy: { _count: { fieldOfStudy: "desc" } },
      take: 10
    }),
    db.paper.groupBy({
      by: ["region"],
      _count: { _all: true },
      orderBy: { _count: { region: "desc" } }
    }),
    db.paper.findMany({
      take: 5,
      orderBy: { downloads: { _count: "desc" } },
      include: { 
        _count: { select: { downloads: true } },
        uploader: { select: { name: true } }
      }
    }),
    db.paper.groupBy({
      by: ["status"],
      _count: { _all: true }
    }),
    // For "submissions over time", we'll just get the last 6 months count
    // This is a bit complex in raw SQL, but we'll approximate with Prisma for now
    db.paper.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);

  const fieldStats = fieldStatsResult as unknown as FieldStat[];
  const regionStats = regionStatsResult as unknown as RegionStat[];
  const topDownloaded = topDownloadedResult as unknown as PaperWithDetails[];
  const statusStats = statusStatsResult as unknown as StatusStat[];

  // Process monthly stats (approximate)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const submissionsByMonth: Record<string, number> = {};
  monthlyStats.forEach((p: { createdAt: Date | string }) => {
    const month = months[new Date(p.createdAt).getMonth()];
    submissionsByMonth[month] = (submissionsByMonth[month] || 0) + 1;
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <Link 
        href="/admin" 
        className="mb-6 flex w-fit items-center gap-2 text-sm font-bold text-psrr-slate hover:text-psrr-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-psrr-navy">Deep Analytics</h1>
          <p className="mt-2 text-psrr-slate">Detailed breakdown of repository content and engagement.</p>
        </div>
        <a 
          href="/api/admin/export" 
          className="inline-flex items-center gap-2 rounded-xl bg-psrr-navy-cta px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition-all hover:bg-psrr-navy active:scale-95"
        >
          <Download className="h-4 w-4" />
          Export CSV Report
        </a>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Field of Study Breakdown */}
        <div className="rounded-xl border border-psrr-border bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-psrr-navy/5 p-2 text-psrr-navy">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-psrr-navy">By Field of Study</h2>
          </div>
          
          <div className="space-y-4">
            {fieldStats.map((stat: FieldStat) => (
              <div key={stat.fieldOfStudy} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tight text-psrr-slate">
                  <span>{stat.fieldOfStudy}</span>
                  <span>{stat._count._all}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-psrr-surface">
                  <div 
                    className="h-full bg-psrr-navy transition-all" 
                    style={{ width: `${Math.min(100, (stat._count._all / (fieldStats[0]?._count._all || 1)) * 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region Breakdown */}
        <div className="rounded-xl border border-psrr-border bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-psrr-navy/5 p-2 text-psrr-navy">
              <PieChart className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-psrr-navy">By Region</h2>
          </div>
          
          <div className="space-y-4">
            {regionStats.map((stat: RegionStat) => (
              <div key={stat.region} className="flex items-center justify-between py-2 border-b border-psrr-border last:border-0">
                <span className="text-sm font-medium text-psrr-navy">{stat.region}</span>
                <span className="rounded-full bg-psrr-surface px-3 py-1 text-xs font-bold text-psrr-navy">
                  {stat._count._all} papers
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Downloaded Papers */}
        <div className="rounded-xl border border-psrr-border bg-white p-8 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-psrr-gold/10 p-2 text-psrr-gold">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-psrr-navy">Most Downloaded Research</h2>
          </div>
          
          <div className="divide-y divide-psrr-border">
            {topDownloaded.map((paper: PaperWithDetails) => (
              <div key={paper.id} className="flex items-center justify-between py-4 group transition-colors hover:bg-psrr-surface -mx-4 px-4 rounded-lg">
                <div className="flex-1 min-w-0 pr-4">
                  <Link href={`/admin/papers/${paper.id}`} className="block text-sm font-bold text-psrr-navy line-clamp-1 hover:text-psrr-navy-cta">
                    {paper.title}
                  </Link>
                  <p className="text-xs text-psrr-slate mt-1">{paper.uploader.name} • {paper.fieldOfStudy}</p>
                </div>
                <div className="flex items-center gap-2 text-psrr-navy font-bold">
                  <Download className="h-4 w-4 text-psrr-gold" />
                  <span>{paper._count.downloads}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lifecycle Status */}
        <div className="rounded-xl border border-psrr-border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-psrr-navy">Lifecycle Status</h2>
          <div className="grid grid-cols-2 gap-4">
            {statusStats.map((stat: StatusStat) => (
              <div key={stat.status} className="rounded-lg bg-psrr-surface p-4 text-center border border-psrr-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-psrr-slate">{stat.status}</p>
                <p className="mt-1 text-2xl font-bold text-psrr-navy">{stat._count._all}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Approximation */}
        <div className="rounded-xl border border-psrr-border bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-psrr-navy">Monthly Submissions (Recent)</h2>
          <div className="flex items-end justify-between gap-2 h-32 pt-4">
            {months.slice(-6).map((m: string) => {
              const count = submissionsByMonth[m] || 0;
              const maxCount = Math.max(...Object.values(submissionsByMonth), 1);
              return (
                <div key={m} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="w-full bg-psrr-navy/20 rounded-t-sm relative group"
                    style={{ height: `${(count / maxCount) * 100}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-psrr-navy opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-psrr-slate uppercase">{m}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
