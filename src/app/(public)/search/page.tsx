import { db } from "@/lib/db";
import Link from "next/link";
import { Search, Filter, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { User, Paper, PaperAuthor, Prisma } from "@prisma/client";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    field?: string;
    region?: string;
    university?: string;
    keyword?: string;
    yearStart?: string;
    yearEnd?: string;
    page?: string;
    sort?: string;
  }>;
}

type PaperWithRelations = Paper & {
  uploader: User;
  authors: PaperAuthor[];
  _count: {
    downloads: number;
  };
};

function SearchResultCard({ paper }: { paper: PaperWithRelations }) {
  const authorsContent = paper.authors.length > 0 ? (
    <div className="flex flex-wrap items-center gap-x-1.5">
      <span className="font-sans text-sm font-bold text-psrr-navy-cta">By</span>
      {paper.authors.map((author: PaperAuthor, idx: number) => (
        <span key={author.authorName} className="flex items-center gap-x-1.5">
          <Link 
            href={`/search?q=${encodeURIComponent(author.authorName)}`}
            className="font-sans text-sm font-bold text-psrr-navy-cta hover:text-psrr-gold hover:underline underline-offset-4 decoration-2"
          >
            {author.authorName}
          </Link>
          {idx < paper.authors.length - 1 && <span className="text-psrr-slate">,</span>}
        </span>
      ))}
    </div>
  ) : (
    <p className="font-sans text-sm font-bold text-psrr-navy-cta">
      By <Link 
            href={`/search?q=${encodeURIComponent(paper.uploader.name)}`}
            className="hover:text-psrr-gold hover:underline underline-offset-4 decoration-2"
          >
            {paper.uploader.name}
          </Link>
    </p>
  );

  return (
    <div className="group relative flex flex-col gap-4 border-l-4 border-psrr-navy-cta bg-psrr-white p-8 shadow-[0_4px_12px_0_rgba(11,31,58,0.04)] transition-all hover:shadow-[0_4px_24px_0_rgba(11,31,58,0.08)]">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-[#D8EAF6] px-3 py-1 text-[12px] font-bold text-psrr-navy-cta">
          {paper.fieldOfStudy}
        </div>
        <span className="font-sans text-[13px] text-psrr-slate">{paper.year}</span>
        <span className="text-psrr-slate-light">·</span>
        <span className="font-sans text-[13px] text-psrr-slate">{paper.region}</span>
      </div>
      
      <h3 className="font-display text-xl font-bold text-psrr-navy group-hover:text-psrr-navy-cta">
        {paper.title}
      </h3>
      
      {authorsContent}
      
      <p className="font-sans text-sm leading-relaxed text-psrr-slate line-clamp-3">
        {paper.abstract}
      </p>
      
      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {paper.keywords.slice(0, 3).map((kw: string, i: number) => (
            <span key={i} className="text-[11px] text-psrr-slate-light italic">#{kw}</span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {paper._count.downloads > 0 && (
            <span className="text-[11px] font-bold text-psrr-slate flex items-center gap-1">
              <ChevronDown className="h-3 w-3 rotate-180" />
              {paper._count.downloads} downloads
            </span>
          )}
          <Link 
            href={`/paper/${paper.id}`}
            className="flex items-center gap-2 font-display text-sm font-bold text-psrr-gold hover:text-psrr-gold-accent shrink-0"
          >
            View Paper
            <span className="text-base">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Research",
};

export default async function SearchPage({
 searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const field = params.field || "";
  const region = params.region || "";
  const university = params.university || "";
  const keyword = params.keyword || "";
  const sort = params.sort || "relevance";

  // Query strings are user input: a non-numeric value must fall back to the
  // default, not reach Prisma as NaN (which throws a validation error).
  const toInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const yearStart = toInt(params.yearStart, 1900);
  const yearEnd = toInt(params.yearEnd, 2100);
  const page = Math.max(1, toInt(params.page, 1));
  const pageSize = 10;

  const whereClause: Prisma.PaperWhereInput = {
    status: "PUBLISHED",
    AND: [
      query ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { abstract: { contains: query, mode: "insensitive" } },
          { keywords: { hasSome: [query] } },
          { authors: { some: { authorName: { contains: query, mode: "insensitive" } } } },
        ],
      } : {},
      field ? { fieldOfStudy: field } : {},
      region ? { region } : {},
      university ? { university } : {},
      // REQ-3.1.4-5: filter by a single keyword/topic
      keyword ? { keywords: { has: keyword } } : {},
      {
        year: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    ],
  };

  // Determine ordering logic
  let orderBy: Prisma.PaperOrderByWithRelationInput = { createdAt: "desc" };
  if (sort === "year_desc") orderBy = { year: "desc" };
  if (sort === "year_asc") orderBy = { year: "asc" };
  if (sort === "downloads") orderBy = { downloads: { _count: "desc" } };

  const [papers, totalCount] = await Promise.all([
    db.paper.findMany({
      where: whereClause,
      include: {
        uploader: true,
        authors: true,
        _count: { select: { downloads: true } }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }) as Promise<PaperWithRelations[]>,
    db.paper.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Facet values (REQ-3.1.4-2 / REQ-3.1.4-5) — drawn from published papers only
  const [uniqueFields, uniqueRegions, uniqueUniversities, keywordRows] = await Promise.all([
    db.paper.findMany({
      where: { status: "PUBLISHED" },
      select: { fieldOfStudy: true },
      distinct: ["fieldOfStudy"],
      orderBy: { fieldOfStudy: "asc" },
    }),
    db.paper.findMany({
      where: { status: "PUBLISHED" },
      select: { region: true },
      distinct: ["region"],
      orderBy: { region: "asc" },
    }),
    db.paper.findMany({
      where: { status: "PUBLISHED" },
      select: { university: true },
      distinct: ["university"],
      orderBy: { university: "asc" },
    }),
    db.paper.findMany({
      where: { status: "PUBLISHED" },
      select: { keywords: true },
    }),
  ]);

  const topKeywords = Object.entries(
    keywordRows
      .flatMap((row: { keywords: string[] }) => row.keywords)
      .reduce<Record<string, number>>((acc, kw) => {
        const key = kw.trim();
        if (key) acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([kw]) => kw);

  return (
    <div className="w-full max-w-[1400px] px-8 py-12 lg:px-16">
      {/* Search Header */}
      <div className="mb-12 flex flex-col gap-6">
        <h1 className="font-display text-4xl font-bold text-psrr-navy tracking-tight">Browse Research</h1>
        <p className="font-sans text-lg text-psrr-slate max-w-2xl">
          Discover thousands of research papers submitted by DOST-SEI scholars across all disciplines.
        </p>
        
        <form action="/search" method="GET" className="flex h-16 w-full max-w-3xl items-center gap-4 rounded-2xl border border-psrr-border bg-white p-2 shadow-[0_2px_8px_rgba(11,31,58,0.04)] focus-within:shadow-[0_4px_20px_rgba(11,31,58,0.08)] transition-all">
          <div className="flex flex-1 items-center gap-3 px-4">
            <Search className="h-5 w-5 text-psrr-slate" />
            <input
              name="q"
              type="text"
              defaultValue={query}
              placeholder="Search by title, keyword, or author..."
              className="w-full font-sans text-base text-psrr-navy outline-none placeholder:text-psrr-slate/50"
            />
          </div>
          {field && <input type="hidden" name="field" value={field} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <button className="h-full rounded-xl bg-psrr-navy-cta px-8 font-display text-sm font-bold text-white transition-all hover:bg-psrr-navy active:scale-95 shadow-sm">
            Search Papers
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-12 lg:flex-row">
        {/* Internal Filters Sidebar */}
        <aside className="w-full shrink-0 lg:w-[260px]">
          <div className="sticky top-24 flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-[11px] font-bold tracking-[0.2em] text-psrr-navy uppercase">Filters</h4>
                {(query || field || region || university || keyword || params.yearStart || params.yearEnd) && (
                  <Link href="/search" className="text-[10px] font-bold text-rose-600 hover:underline">RESET</Link>
                )}
              </div>
              <div className="h-px w-full bg-psrr-border" />
            </div>

            {/* Field of Study */}
            <div className="flex flex-col gap-4">
              <h5 className="font-sans text-[11px] font-bold tracking-widest text-psrr-slate uppercase">Discipline</h5>
              <div className="flex flex-col gap-2">
                <Link 
                  href={`/search?${new URLSearchParams({ ...params, field: "" }).toString()}`} 
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${!field ? "bg-psrr-navy/5 font-bold text-psrr-navy-cta" : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"}`}
                >
                  All Fields
                </Link>
                {uniqueFields.map((f: { fieldOfStudy: string }) => (
                  <Link 
                    key={f.fieldOfStudy}
                    href={`/search?${new URLSearchParams({ ...params, field: f.fieldOfStudy }).toString()}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${field === f.fieldOfStudy ? "bg-psrr-navy/5 font-bold text-psrr-navy-cta" : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"}`}
                  >
                    {f.fieldOfStudy}
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-psrr-border" />

            {/* Region */}
            <div className="flex flex-col gap-4">
              <h5 className="font-sans text-[11px] font-bold tracking-widest text-psrr-slate uppercase">Region</h5>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/search?${new URLSearchParams({ ...params, region: "", page: "1" }).toString()}`}
                  className={`rounded-lg px-3 py-2 text-sm transition-all ${!region ? "bg-psrr-navy/5 font-bold text-psrr-navy-cta" : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"}`}
                >
                  All Regions
                </Link>
                {uniqueRegions.map((r: { region: string }) => (
                  <Link
                    key={r.region}
                    href={`/search?${new URLSearchParams({ ...params, region: r.region, page: "1" }).toString()}`}
                    className={`rounded-lg px-3 py-2 text-sm transition-all ${region === r.region ? "bg-psrr-navy/5 font-bold text-psrr-navy-cta" : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"}`}
                  >
                    {r.region}
                  </Link>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-psrr-border" />

            {/* University */}
            <div className="flex flex-col gap-4">
              <h5 className="font-sans text-[11px] font-bold tracking-widest text-psrr-slate uppercase">University</h5>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/search?${new URLSearchParams({ ...params, university: "", page: "1" }).toString()}`}
                  className={`rounded-lg px-3 py-2 text-sm transition-all ${!university ? "bg-psrr-navy/5 font-bold text-psrr-navy-cta" : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"}`}
                >
                  All Universities
                </Link>
                {uniqueUniversities.map((u: { university: string }) => (
                  <Link
                    key={u.university}
                    href={`/search?${new URLSearchParams({ ...params, university: u.university, page: "1" }).toString()}`}
                    className={`rounded-lg px-3 py-2 text-sm transition-all ${university === u.university ? "bg-psrr-navy/5 font-bold text-psrr-navy-cta" : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"}`}
                  >
                    {u.university}
                  </Link>
                ))}
              </div>
            </div>

            {topKeywords.length > 0 && (
              <>
                <div className="h-px w-full bg-psrr-border" />
                <div className="flex flex-col gap-4">
                  <h5 className="font-sans text-[11px] font-bold tracking-widest text-psrr-slate uppercase">Keywords</h5>
                  <div className="flex flex-wrap gap-2">
                    {keyword && (
                      <Link
                        href={`/search?${new URLSearchParams({ ...params, keyword: "", page: "1" }).toString()}`}
                        className="rounded-full border border-psrr-border px-3 py-1 text-[11px] font-bold text-rose-600 hover:bg-psrr-surface"
                      >
                        Clear
                      </Link>
                    )}
                    {topKeywords.map((kw: string) => (
                      <Link
                        key={kw}
                        href={`/search?${new URLSearchParams({ ...params, keyword: kw, page: "1" }).toString()}`}
                        className={`rounded-full px-3 py-1 text-[11px] transition-all ${keyword === kw ? "bg-psrr-navy-cta font-bold text-white" : "bg-psrr-surface text-psrr-slate hover:text-psrr-navy"}`}
                      >
                        #{kw}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="h-px w-full bg-psrr-border" />

            {/* Year Range */}
            <div className="flex flex-col gap-4">
              <h5 className="font-sans text-[11px] font-bold tracking-widest text-psrr-slate uppercase">Publication Year</h5>
              <form action="/search" method="GET" className="flex flex-col gap-4">
                {query && <input type="hidden" name="q" value={query} />}
                {field && <input type="hidden" name="field" value={field} />}
                {region && <input type="hidden" name="region" value={region} />}
                {university && <input type="hidden" name="university" value={university} />}
                {keyword && <input type="hidden" name="keyword" value={keyword} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
                <div className="flex items-center gap-2">
                  <input 
                    name="yearStart"
                    type="number" 
                    placeholder="From"
                    defaultValue={params.yearStart}
                    className="w-full rounded-lg border border-psrr-border bg-white px-3 py-2 font-sans text-xs text-psrr-navy outline-none focus:border-psrr-navy-cta transition-all"
                  />
                  <span className="text-psrr-slate-light text-xs">to</span>
                  <input 
                    name="yearEnd"
                    type="number" 
                    placeholder="To"
                    defaultValue={params.yearEnd}
                    className="w-full rounded-lg border border-psrr-border bg-white px-3 py-2 font-sans text-xs text-psrr-navy outline-none focus:border-psrr-navy-cta transition-all"
                  />
                </div>
                <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-psrr-surface py-2 text-xs font-bold text-psrr-navy hover:bg-psrr-border transition-all">
                  <Filter className="h-3 w-3" />
                  Apply Range
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Results Area */}
        <main className="flex-1 flex flex-col gap-8 min-w-0">
          <div className="flex items-center justify-between border-b border-psrr-border pb-6">
            <h2 className="font-display text-xl font-bold text-psrr-navy">
              {query ? `Results for "${query}"` : "Latest Submissions"}
            </h2>
            
            <div className="flex items-center gap-6">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-psrr-slate uppercase tracking-wider">Sort by:</span>
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-lg border border-psrr-border bg-white px-3 py-1.5 text-xs font-bold text-psrr-navy hover:bg-psrr-surface transition-all">
                    {sort === "relevance" ? "Relevance" : 
                     sort === "year_desc" ? "Year (Newest)" : 
                     sort === "year_asc" ? "Year (Oldest)" : 
                     sort === "downloads" ? "Most Downloaded" : "Sort Options"}
                    <ChevronDown className="h-3.5 w-3.5 text-psrr-slate" />
                  </button>
                  <div className="absolute right-0 top-full z-10 mt-1 hidden w-48 rounded-xl border border-psrr-border bg-white py-2 shadow-xl group-hover:block animate-in fade-in slide-in-from-top-1">
                    {[
                      { label: "Relevance", val: "relevance" },
                      { label: "Year (Newest First)", val: "year_desc" },
                      { label: "Year (Oldest First)", val: "year_asc" },
                      { label: "Most Downloaded", val: "downloads" },
                    ].map((opt: { label: string; val: string }) => (
                      <Link
                        key={opt.val}
                        href={`/search?${new URLSearchParams({ ...params, sort: opt.val, page: "1" }).toString()}`}
                        className={`block px-4 py-2 text-xs font-bold transition-all ${sort === opt.val ? "bg-psrr-navy/5 text-psrr-navy-cta" : "text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy"}`}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-4 w-px bg-psrr-border" />

              <div className="flex items-center gap-4 text-sm font-medium text-psrr-slate">
                <span>{totalCount} {totalCount === 1 ? "paper" : "papers"} found</span>
                <div className="h-4 w-px bg-psrr-border" />
                <span>Page {page} of {totalPages || 1}</span>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex flex-col gap-6">
            {papers.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-psrr-border bg-white/50 p-20 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-psrr-surface text-psrr-slate">
                  <Search className="h-10 w-10" />
                </div>
                <h3 className="font-display text-xl font-bold text-psrr-navy mb-2">No results found</h3>
                <p className="text-psrr-slate font-sans mb-8">Try adjusting your filters or search terms.</p>
                <Link href="/search" className="inline-flex h-11 items-center rounded-xl bg-psrr-navy px-8 font-display text-sm font-bold text-white transition-all hover:bg-psrr-navy-cta">
                  Clear all filters
                </Link>
              </div>
            ) : (
              papers.map((paper: PaperWithRelations) => (
                <SearchResultCard key={paper.id} paper={paper} />
              ))
            )}
          </div>

          {/* Pagination Control */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={`/search?${new URLSearchParams({ ...params, page: (page - 1).toString() }).toString()}`}
                  className="flex h-11 items-center gap-2 rounded-xl border border-psrr-border bg-white px-6 font-display text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-surface active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              )}
              
              <div className="flex h-11 items-center gap-1 rounded-xl bg-psrr-surface px-2">
                {[...Array(totalPages)].map((_: unknown, i: number) => {
                  const p = i + 1;
                  // Only show current, first, last, and neighbors
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <Link
                        key={p}
                        href={`/search?${new URLSearchParams({ ...params, page: p.toString() }).toString()}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${page === p ? "bg-psrr-navy-cta text-white shadow-sm" : "text-psrr-slate hover:text-psrr-navy"}`}
                      >
                        {p}
                      </Link>
                    );
                  }
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p} className="px-1 text-psrr-slate-light">...</span>;
                  }
                  return null;
                })}
              </div>

              {page < totalPages && (
                <Link
                  href={`/search?${new URLSearchParams({ ...params, page: (page + 1).toString() }).toString()}`}
                  className="flex h-11 items-center gap-2 rounded-xl border border-psrr-border bg-white px-6 font-display text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-surface active:scale-95"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
