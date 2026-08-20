import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { History, ArrowLeft, ArrowRight } from "lucide-react";

import { Metadata } from "next";

interface AuditLogWithDetails {
  id: string;
  adminId: string;
  paperId: string | null;
  action: string;
  detail: string | null;
  createdAt: Date;
  admin: {
    name: string;
    email: string;
  };
  paper: {
    title: string;
  } | null;
}

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 0;
  const PAGE_SIZE = 20;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  const [logsResult, totalCount] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        admin: { select: { name: true, email: true } },
        paper: { select: { title: true } }
      },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    db.auditLog.count(),
  ]);

  const logs = logsResult as unknown as AuditLogWithDetails[];
  const hasNext = (page + 1) * PAGE_SIZE < totalCount;
  const hasPrev = page > 0;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <Link 
        href="/admin" 
        className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-psrr-slate hover:text-psrr-navy transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-psrr-navy">System Audit Logs</h1>
            <p className="mt-2 text-psrr-slate">Track all administrative actions and security events.</p>
          </div>
          <div className="flex h-12 items-center gap-3 rounded-xl border border-psrr-border bg-psrr-surface px-5 text-psrr-navy shadow-sm">
            <History className="h-5 w-5 text-psrr-navy-cta" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-psrr-slate">Logged Actions</span>
              <span className="text-sm font-bold leading-none">{totalCount.toLocaleString()} Total Events</span>
            </div>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border-l-4 border-l-psrr-navy bg-white shadow-sm border-y border-r border-psrr-border">
        {/* Table Header */}
        <div className="flex items-center gap-6 bg-psrr-surface px-6 py-4 border-b border-psrr-border">
          <div className="w-[180px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Administrator</div>
          <div className="flex-1 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Action & Detail</div>
          <div className="w-[180px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Related Paper</div>
          <div className="w-[180px] shrink-0 text-right text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Timestamp</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-psrr-border">
          {logs.length === 0 ? (
            <div className="p-20 text-center text-psrr-slate italic">No audit logs found.</div>
          ) : (
            logs.map((log: AuditLogWithDetails) => (
              <div key={log.id} className="group flex items-center gap-6 px-6 py-4 hover:bg-psrr-surface transition-colors">
                <div className="w-[180px] shrink-0">
                  <p className="text-sm font-bold text-psrr-navy">{log.admin.name || "System"}</p>
                  <p className="text-[10px] text-psrr-slate truncate">{log.admin.email}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-psrr-navy uppercase tracking-tight">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  {log.detail && (
                    <p className="text-xs text-psrr-slate mt-0.5 line-clamp-1">{log.detail}</p>
                  )}
                </div>
                <div className="w-[180px] shrink-0">
                  {log.paper ? (
                    <p className="text-xs font-bold text-psrr-navy-cta line-clamp-1">{log.paper.title}</p>
                  ) : (
                    <span className="text-xs text-psrr-slate italic opacity-50">N/A</span>
                  )}
                </div>
                <div className="w-[180px] shrink-0 text-right">
                  <p className="text-sm text-psrr-navy font-bold">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-psrr-slate font-medium">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-psrr-surface px-6 py-4 flex items-center justify-between border-t border-psrr-border">
          <span className="text-[11px] font-medium text-psrr-slate italic">
            Showing {logs.length} of {totalCount} events
          </span>
          <div className="flex gap-2">
            <Link 
              href={`/admin/audit?page=${page - 1}`}
              className={`flex items-center gap-1 rounded-lg border border-psrr-border bg-white px-4 py-1.5 text-[11px] font-bold text-psrr-slate shadow-sm transition-all hover:bg-psrr-surface ${!hasPrev ? "pointer-events-none opacity-50" : ""}`}
            >
              <ArrowLeft className="h-3 w-3" />
              Prev
            </Link>
            <Link 
              href={`/admin/audit?page=${page + 1}`}
              className={`flex items-center gap-1 rounded-lg border border-psrr-border bg-white px-4 py-1.5 text-[11px] font-bold text-psrr-slate shadow-sm transition-all hover:bg-psrr-surface ${!hasNext ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
