import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDownloadUrl } from "@/lib/storage";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submission Details",
};

interface PaperAuthor {
  authorName: string;
}

export default async function ScholarPaperDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user.isActive) {
    redirect("/login");
  }

  const paper = await db.paper.findUnique({
    where: { id },
    include: { 
      authors: true,
      _count: {
        select: { downloads: true }
      }
    },
  });

  if (!paper) {
    notFound();
  }

  // Security: Only the uploader or an ADMIN can view this page
  if (paper.uploaderId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/403");
  }

  // Generate a signed URL for the PDF (valid for 1 hour)
  let pdfUrl = "#";
  try {
    pdfUrl = await getDownloadUrl(paper.filePath, 3600);
  } catch (e) {
    console.error("Failed to generate PDF URL", e);
  }

  const statusColors: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-psrr-gold/5 text-psrr-gold border-psrr-gold/20",
    RETURNED: "bg-rose-50 text-rose-700 border-rose-200",
    DRAFT: "bg-psrr-surface text-psrr-slate border-psrr-border",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    PUBLISHED: <CheckCircle className="h-4 w-4" />,
    PENDING: <Clock className="h-4 w-4" />,
    RETURNED: <AlertTriangle className="h-4 w-4" />,
    DRAFT: <FileText className="h-4 w-4" />,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-16">
      <Link 
        href="/scholar" 
        className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-psrr-slate hover:text-psrr-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusColors[paper.status]}`}>
              {statusIcons[paper.status]}
              {paper.status}
            </span>
            <span className="text-xs text-psrr-slate">
              Submitted on {new Date(paper.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-psrr-navy lg:text-4xl">
            {paper.title}
          </h1>
        </div>
        
        {paper.status === 'RETURNED' && (
          <Link 
            href={`/scholar/submit?edit=${paper.id}`}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-psrr-gold px-6 font-display text-sm font-bold text-psrr-white transition-all hover:bg-psrr-gold-accent active:scale-95 shadow-md"
          >
            Revise & Resubmit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-10">
          {paper.status === 'RETURNED' && paper.returnFeedback && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-bold text-rose-700 mb-3">
                <AlertTriangle className="h-5 w-5" />
                Reviewer Feedback
              </h2>
              <p className="text-sm leading-relaxed text-rose-600 whitespace-pre-wrap italic">
                &ldquo;{paper.returnFeedback}&rdquo;
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-bold text-psrr-navy">Abstract</h2>
            <p className="font-sans text-base leading-relaxed text-psrr-slate whitespace-pre-wrap">
              {paper.abstract}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-bold text-psrr-navy">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {paper.keywords.map((k: string) => (
                <span key={k} className="rounded-lg border border-psrr-border bg-psrr-white px-4 py-1.5 text-xs text-psrr-navy shadow-sm">
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-8">
          <div className="rounded-xl border border-psrr-border bg-psrr-white p-8 shadow-sm">
            <h3 className="mb-6 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Submission Details</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">Authors</label>
                <p className="text-sm font-bold text-psrr-navy">
                  {paper.authors.length > 0 ? paper.authors.map((a: PaperAuthor) => a.authorName).join(", ") : session.user.name}
                </p>
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">Field of Study</label>
                <p className="text-sm text-psrr-navy">{paper.fieldOfStudy}</p>
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">University</label>
                <p className="text-sm text-psrr-navy">{paper.university}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">Advisor</label>
                <p className="text-sm text-psrr-navy">{paper.advisorName}</p>
              </div>

              <div className="pt-4 border-t border-psrr-border">
                <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">Total Downloads</label>
                <p className="text-xl font-bold text-psrr-navy-cta">{paper._count.downloads}</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-psrr-border">
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-psrr-navy px-4 py-3 font-display text-sm font-bold text-white transition-all hover:bg-psrr-navy-light shadow-sm"
              >
                <FileText className="h-4 w-4" />
                View Submitted PDF
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
