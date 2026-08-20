import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ChevronRight, FileText, Search, Clock, Filter } from "lucide-react";
import PaperFilters from "./PaperFilters";

import { Metadata } from "next";
import { Prisma, Paper, User } from "@prisma/client";

type PaperWithUploader = Paper & { uploader: User };

export const metadata: Metadata = {
  title: "Manage Research",
};

export default async function AdminPapersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = (params.q as string) || "";
  const status = (params.status as string) || "";
  const field = (params.field as string) || "";
  const region = (params.region as string) || "";
  const page = Number(params.page) || 0;
  const PAGE_SIZE = 10;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  // Build the where clause for filtering
  const where: Prisma.PaperWhereInput = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { uploader: { name: { contains: query, mode: "insensitive" } } },
    ];
  }
  if (status) {
    where.status = status as Prisma.EnumPaperStatusFilter;
  }
  if (field) {
    where.fieldOfStudy = field;
  }
  if (region) {
    where.region = region;
  }

  const [papers, totalCount] = await Promise.all([
    db.paper.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { uploader: true },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    db.paper.count({ where }),
  ]);

  const pendingCount = await db.paper.count({
    where: { status: "PENDING" }
  });

  const hasNext = (page + 1) * PAGE_SIZE < totalCount;
  const hasPrev = page > 0;

  // Helper to build pagination URLs
  const getPageUrl = (newPage: number) => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (status) p.set("status", status);
    if (field) p.set("field", field);
    if (region) p.set("region", region);
    if (newPage > 0) p.set("page", newPage.toString());
    return `/admin/papers?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <header className="mb-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-psrr-navy">Review Queue</h1>
            <p className="mt-2 text-psrr-slate">Manage and verify research submissions from scholars.</p>
          </div>
        </div>
        
        {/* Filters and Search Bar - Client Component */}
        <PaperFilters 
          initialQuery={query} 
          initialStatus={status} 
          pendingCount={pendingCount} 
        />
      </header>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border-l-4 border-l-psrr-navy bg-white shadow-sm border-y border-r border-psrr-border">
        {/* Table Header */}
        <div className="flex items-center gap-6 bg-psrr-surface px-6 py-4 border-b border-psrr-border">
          <div className="w-[180px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Scholar</div>
          <div className="flex-1 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Title</div>
          <div className="w-[140px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Field</div>
          <div className="w-[110px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Submitted</div>
          <div className="w-[110px] shrink-0 text-center text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Status</div>
          <div className="w-[90px] shrink-0 text-right text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Action</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-psrr-border">
          {papers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="rounded-full bg-psrr-surface p-4 mb-4">
                <Search className="h-8 w-8 text-psrr-slate-light" />
              </div>
              <p className="text-psrr-navy font-bold">No results found</p>
              <p className="text-sm text-psrr-slate mt-1">Try adjusting your filters or search terms.</p>
              <Link href="/admin/papers" className="mt-6 text-sm font-bold text-psrr-navy-cta hover:underline">Clear all filters</Link>
            </div>
          ) : (
            papers.map((paper) => (
              <div key={paper.id} className="group flex min-h-[80px] items-center gap-6 px-6 py-4 transition-colors hover:bg-psrr-surface">
                {/* Scholar Info */}
                <div className="w-[180px] shrink-0 flex flex-col justify-center">
                  <span className="text-sm font-bold text-psrr-navy line-clamp-1">{paper.uploader.name}</span>
                  <span className="text-[10px] font-medium text-psrr-slate line-clamp-1 mt-0.5">{paper.university}</span>
                </div>

                {/* Paper Title */}
                <div className="flex-1 flex items-center">
                  <Link href={`/admin/papers/${paper.id}`} className="text-sm font-medium leading-tight text-psrr-navy group-hover:text-psrr-navy-cta transition-colors line-clamp-2">
                    {paper.title}
                  </Link>
                </div>

                {/* Field of Study (Badge) */}
                <div className="w-[140px] shrink-0 flex items-center">
                  <span className="inline-flex max-w-full rounded-md bg-psrr-navy/5 px-2.5 py-1 text-[10px] font-bold text-psrr-navy uppercase tracking-tighter border border-psrr-navy/10 truncate">
                    {paper.fieldOfStudy}
                  </span>
                </div>

                {/* Submitted Date */}
                <div className="w-[110px] shrink-0 text-[13px] text-psrr-slate flex items-center">
                  {new Date(paper.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>

                {/* Status Badge */}
                <div className="w-[110px] shrink-0 flex items-center justify-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    paper.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" :
                    paper.status === "PENDING" ? "bg-psrr-gold/10 text-psrr-gold" :
                    paper.status === "RETURNED" ? "bg-rose-100 text-rose-700" :
                    "bg-psrr-surface text-psrr-slate"
                  }`}>
                    {paper.status}
                  </span>
                </div>

                {/* Action Button */}
                <div className="w-[90px] shrink-0 flex items-center justify-end">
                  <Link 
                    href={`/admin/papers/${paper.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-psrr-navy px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-psrr-navy-light active:scale-95"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Table Footer */}
        <div className="bg-psrr-surface px-6 py-4 flex items-center justify-between border-t border-psrr-border">
          <span className="text-[11px] font-medium text-psrr-slate italic">
            {totalCount === 0 ? "No submissions found" : `Showing ${papers.length} of ${totalCount} result${totalCount === 1 ? "" : "s"}`}
          </span>
          <div className="flex gap-2">
            <Link 
              href={getPageUrl(page - 1)}
              className={`rounded-lg border border-psrr-border bg-white px-4 py-1.5 text-[11px] font-bold text-psrr-slate shadow-sm transition-all hover:bg-psrr-surface ${!hasPrev ? "pointer-events-none opacity-50" : ""}`}
            >
              Prev
            </Link>
            <Link 
              href={getPageUrl(page + 1)}
              className={`rounded-lg border border-psrr-border bg-white px-4 py-1.5 text-[11px] font-bold text-psrr-slate shadow-sm transition-all hover:bg-psrr-surface ${!hasNext ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
