import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDownloadUrl } from "@/lib/storage";
import ReviewActions from "../ReviewActions";
import Link from "next/link";
import { CheckCircle, FileText, ChevronRight, AlertCircle, Info } from "lucide-react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Research",
};

interface PaperAuthor {
  authorName: string;
}

export default async function PaperDetailsPage({
 params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  const paper = await db.paper.findUnique({
    where: { id },
    include: { uploader: true, authors: true },
  });

  if (!paper) {
    notFound();
  }

  const authorsList = paper.authors.length > 0 
    ? paper.authors.map((a: PaperAuthor) => a.authorName).join(", ")
    : paper.uploader.name;

  // Generate a signed URL for the PDF (valid for 1 hour)
  let pdfUrl = "#";
  try {
    pdfUrl = await getDownloadUrl(paper.filePath, 3600);
  } catch (e) {
    console.error("Failed to generate PDF URL", e);
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/admin/papers" className="text-psrr-slate hover:text-psrr-navy transition-colors">
          Review Queue
        </Link>
        <span className="text-psrr-slate-light">/</span>
        <span className="font-semibold text-psrr-navy">Submission Review</span>
      </nav>

      {/* Page Title */}
      <header className="mb-10 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-psrr-navy">Review Submission</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Paper Metadata Card */}
          <div className="rounded-xl border-l-4 border-l-psrr-navy bg-white p-8 shadow-sm border-y border-r border-psrr-border">
            <h2 className="text-[11px] font-bold text-psrr-slate uppercase tracking-[0.2em] mb-4">Paper Metadata</h2>
            <h3 className="font-display text-xl font-bold text-psrr-navy leading-tight mb-3">
              {paper.title}
            </h3>
            <p className="text-sm text-psrr-slate mb-6">
              {authorsList} • {paper.university} • {paper.year} • {paper.fieldOfStudy}
            </p>
            
            <div className="h-px bg-psrr-border w-full mb-6" />
            
            <h4 className="text-sm font-bold text-psrr-navy mb-3">Abstract</h4>
            <p className="text-sm leading-relaxed text-psrr-slate whitespace-pre-wrap">
              {paper.abstract}
            </p>
          </div>

          {/* File Integrity Card */}
          <div className="rounded-xl border-l-4 border-l-psrr-navy bg-white p-8 shadow-sm border-y border-r border-psrr-border">
            <h2 className="text-[11px] font-bold text-psrr-slate uppercase tracking-[0.2em] mb-4">File Integrity</h2>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-psrr-navy text-white shadow-inner">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-psrr-navy text-sm">research_manuscript.pdf</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-xs text-psrr-slate mt-0.5">Application/PDF • Verified Upload</p>
              </div>
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full border border-psrr-navy-cta px-4 py-1.5 text-xs font-bold text-psrr-navy-cta hover:bg-psrr-navy-cta hover:text-white transition-all active:scale-95"
              >
                View Full PDF
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Admin Decisions */}
        <div className="w-full lg:w-[320px] shrink-0">
          <ReviewActions paperId={paper.id} currentStatus={paper.status} />
        </div>
      </div>
    </div>
  );
}
