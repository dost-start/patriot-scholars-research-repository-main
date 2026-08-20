import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FileText, Users, Download, ArrowUpRight, Clock, Activity } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { Paper, User, AuditLog } from "@prisma/client";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface PaperWithUploader extends Paper {
  uploader: User;
}

interface AuditLogWithAdmin extends AuditLog {
  admin: User;
}

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminOverviewPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  const [totalPapers, pendingPapers, totalUsers, scholarUsers, recentPapersRaw, recentLogsRaw] = await Promise.all([
    db.paper.count(),
    db.paper.count({ where: { status: "PENDING" } }),
    db.user.count(),
    db.user.count({ where: { role: "SCHOLAR" } }),
    db.paper.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { uploader: true },
    }),
    db.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { admin: true },
    }),
  ]);

  const recentPapers = recentPapersRaw as PaperWithUploader[];
  const recentLogs = recentLogsRaw as AuditLogWithAdmin[];

  const stats: StatItem[] = [
    { label: "Total Papers", value: totalPapers.toLocaleString(), icon: FileText, color: "border-psrr-navy", bg: "bg-psrr-navy/5" },
    { label: "Scholars", value: scholarUsers.toLocaleString(), icon: Users, color: "border-psrr-navy", bg: "bg-psrr-navy/5" },
    { label: "Pending Review", value: pendingPapers, icon: Clock, color: "border-psrr-gold", bg: "bg-psrr-gold/10" },
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Activity, color: "border-psrr-navy", bg: "bg-psrr-navy/5" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-psrr-navy">Analytics Overview</h1>
          <p className="mt-2 text-psrr-slate">A summary of the repository's status and growth.</p>
        </div>
        <a 
          href="/api/admin/export"
          className="flex items-center gap-2 rounded-lg border border-psrr-border bg-white px-4 py-2 text-sm font-bold text-psrr-navy shadow-sm transition-all hover:bg-psrr-surface active:scale-95"
        >
          <Download className="h-4 w-4" />
          Export Report
        </a>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link 
            key={stat.label} 
            href="/admin/analytics"
            className={`group rounded-xl border-l-4 ${stat.color} bg-white p-6 shadow-sm border-y border-r border-psrr-border transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`rounded-lg ${stat.bg} p-2 text-psrr-navy`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-psrr-slate opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs font-bold text-psrr-slate uppercase tracking-widest">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-psrr-navy">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border-l-4 border-l-psrr-navy bg-white shadow-sm border-y border-r border-psrr-border overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-psrr-border">
              <h2 className="text-lg font-bold text-psrr-navy">Recent Submissions</h2>
              <Link href="/admin/papers" className="text-sm font-bold text-psrr-navy-cta hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-psrr-border">
              {recentPapers.length === 0 ? (
                <p className="p-12 text-center text-sm text-psrr-slate italic">No recent submissions found.</p>
              ) : (
                recentPapers.map((paper) => (
                  <div key={paper.id} className="flex items-center justify-between p-6 hover:bg-psrr-surface transition-colors">
                    <div>
                      <p className="text-sm font-bold text-psrr-navy line-clamp-1">{paper.title}</p>
                      <p className="text-xs text-psrr-slate mt-1">{paper.uploader.name} • {new Date(paper.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      paper.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" :
                      paper.status === "PENDING" ? "bg-psrr-gold/10 text-psrr-gold" :
                      "bg-psrr-surface text-psrr-slate"
                    }`}>
                      {paper.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Activity */}
        <div className="rounded-xl border-l-4 border-l-psrr-navy bg-white shadow-sm border-y border-r border-psrr-border overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-psrr-border">
            <h2 className="text-lg font-bold text-psrr-navy">System Activity</h2>
            <Link href="/admin/audit" className="text-sm font-bold text-psrr-navy-cta hover:underline">View All</Link>
          </div>
          <div className="p-8 space-y-8">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-psrr-slate italic">No recent activity recorded.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-psrr-gold" />
                  <div className="flex-1">
                    <p className="text-xs text-psrr-navy leading-relaxed">
                      <span className="font-bold">{log.admin.name}</span> <span className="text-psrr-slate">{log.action.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-[10px] text-psrr-slate-light mt-1.5 font-bold uppercase tracking-wider">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
