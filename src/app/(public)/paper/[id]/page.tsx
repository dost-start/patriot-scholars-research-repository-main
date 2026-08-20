import { Metadata } from "next";
import { db } from "@/lib/db";
import { getDownloadUrl } from "@/lib/storage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Lock } from "lucide-react";

import { PaperAuthor } from "@prisma/client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const paper = await db.paper.findUnique({
    where: { id },
    select: { title: true }
  });

  if (!paper) {
    return { title: "Paper Not Found" };
  }

  return {
    title: paper.title,
  };
}

export default async function PaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const paper = await db.paper.findUnique({
    where: { id },
    include: { 
      uploader: true, 
      authors: true,
      _count: {
        select: { downloads: true }
      }
    },
  });

  if (!paper || paper.status !== "PUBLISHED") {
    notFound();
  }

  const authorsLinks = paper.authors.length > 0 ? (
    <div className="flex flex-wrap items-center gap-x-1.5">
      <span className="font-bold text-psrr-navy-cta">By</span>
      {paper.authors.map((author: PaperAuthor, idx: number) => (
        <span key={author.authorName} className="flex items-center gap-x-1.5">
          <Link 
            href={author.userId ? `/scholar/${author.userId}` : `/search?q=${encodeURIComponent(author.authorName)}`}
            className="font-bold text-psrr-navy-cta hover:text-psrr-gold hover:underline underline-offset-4 decoration-2"
          >
            {author.authorName}
          </Link>
          {idx < paper.authors.length - 1 && <span className="text-psrr-slate">,</span>}
        </span>
      ))}
    </div>
  ) : (
    <Link 
      href={`/scholar/${paper.uploaderId}`}
      className="font-bold text-psrr-navy-cta hover:text-psrr-gold hover:underline underline-offset-4 decoration-2"
    >
      By {paper.uploader.name}
    </Link>
  );

  const citationAuthors = paper.authors.length > 0
    ? paper.authors.map((a: PaperAuthor) => {
        const parts = a.authorName.split(" ");
        const lastName = parts[parts.length - 1];
        const initial = parts[0][0];
        return `${lastName}, ${initial}.`;
      }).join(", & ")
    : paper.uploader.name;

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-16">
      {/* Breadcrumbs */}
      <nav className="mb-10 flex items-center gap-3 font-sans text-[13px]">
        <Link href="/" className="text-psrr-slate-light hover:text-psrr-navy">Home</Link>
        <span className="text-psrr-border">/</span>
        <Link href="/search" className="text-psrr-slate-light hover:text-psrr-navy">Browse Papers</Link>
        <span className="text-psrr-border">/</span>
        <span className="text-psrr-slate-light">{paper.fieldOfStudy}</span>
        <span className="text-psrr-border">/</span>
        <span className="font-bold text-psrr-navy-cta line-clamp-1">{paper.title}</span>
      </nav>

      <div className="flex flex-col gap-16 lg:flex-row">
        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-10">
          {/* Header Area */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full bg-[#D8EAF6] px-3 py-1 text-[12px] font-bold text-psrr-navy-cta">
                {paper.fieldOfStudy}
              </div>
              <div className="rounded-full border border-[#8EC4E8] bg-psrr-surface px-3 py-1 text-[12px] font-bold text-psrr-navy">
                {paper.region}
              </div>
            </div>
            
            <h1 className="font-display text-4xl font-bold leading-tight text-psrr-navy lg:text-5xl">
              {paper.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 font-sans text-sm">
              {authorsLinks}
              <span className="text-psrr-border">|</span>
              <span className="text-psrr-slate">{paper.year}</span>
              <span className="text-psrr-border">|</span>
              <span className="text-psrr-slate">Published {new Date(paper.createdAt).toLocaleDateString()}</span>
              <span className="text-psrr-border">|</span>
              <span className="text-psrr-navy-cta font-bold">{paper._count.downloads} Downloads</span>
            </div>
          </div>

          {/* Abstract Area */}
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-bold text-psrr-navy">Abstract</h2>
            <p className="font-sans text-base leading-[1.8] text-psrr-slate whitespace-pre-wrap">
              {paper.abstract}
            </p>
          </div>

          {/* Keywords Area */}
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-psrr-navy">Keywords</h2>
            <div className="flex flex-wrap gap-3">
              {paper.keywords.map((k: string) => (
                <div key={k} className="rounded border border-psrr-border bg-psrr-surface px-4 py-1.5 font-sans text-[13px] text-psrr-slate">
                  {k}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Metadata Card */}
        <aside className="w-full shrink-0 lg:w-[320px]">
          <div className="flex flex-col gap-6 border-l-4 border-psrr-navy-cta bg-psrr-white p-6 shadow-[0_4px_12px_0_rgba(11,31,58,0.04)]">
            <h3 className="font-display text-sm font-bold tracking-wider text-psrr-navy">PAPER METADATA</h3>
            <div className="h-px w-full bg-psrr-border" />
            
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] font-bold tracking-widest text-psrr-slate-light uppercase">UNIVERSITY</span>
              <span className="font-sans text-[13px] font-bold text-psrr-navy">{paper.university}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] font-bold tracking-widest text-psrr-slate-light uppercase">ADVISOR</span>
              <span className="font-sans text-[13px] font-bold text-psrr-navy">{paper.advisorName}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] font-bold tracking-widest text-psrr-slate-light uppercase">YEAR</span>
              <span className="font-sans text-[13px] font-bold text-psrr-navy">{paper.year}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] font-bold tracking-widest text-psrr-slate-light uppercase">REGION</span>
              <span className="font-sans text-[13px] font-bold text-psrr-navy">{paper.region}</span>
            </div>

            {/* Citation Box */}
            <div className="flex flex-col gap-2 rounded bg-psrr-surface p-4">
              <span className="font-sans text-[10px] font-bold tracking-widest text-psrr-slate-light uppercase">CITE THIS PAPER</span>
              <p className="font-sans text-[11px] leading-relaxed text-psrr-slate italic">
                {citationAuthors} ({paper.year}). {paper.title}. Patriot Scholars Research Repository.
              </p>
            </div>

            {session?.user ? (
              <a 
                href={`/api/paper/${paper.id}/download`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-psrr-navy-cta py-3 font-display text-sm font-bold text-psrr-white transition-all hover:bg-psrr-navy shadow-md"
              >
                Download
                <span className="text-base leading-none">↓</span>
              </a>
            ) : (
              <div className="flex flex-col gap-3">
                <button 
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-psrr-slate/20 py-3 font-display text-sm font-bold text-psrr-slate"
                >
                  <Lock className="h-4 w-4" />
                  Download Restricted
                </button>
                <p className="text-[11px] text-center text-psrr-slate italic">
                  Please <Link href="/login" className="text-psrr-navy-cta font-bold hover:underline">sign in</Link> to download full-text papers.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

