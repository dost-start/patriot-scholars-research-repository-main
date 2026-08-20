import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeletePaperButton from "../DeletePaperButton";

import { Metadata } from "next";
import { Paper } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Submissions",
};

export default async function ScholarSubmissionsPage() {

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "SCHOLAR" || !session.user.isActive) {
    redirect("/login");
  }

  const papers = await db.paper.findMany({
    where: { uploaderId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-16">
      <nav className="mb-8 flex items-center gap-3 font-sans text-[13px]">
        <Link href="/scholar" className="text-psrr-slate-light hover:text-psrr-navy">Dashboard</Link>
        <span className="text-psrr-border">/</span>
        <span className="font-bold text-psrr-navy-cta">My Submissions</span>
      </nav>

      <div className="mb-12 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold text-psrr-navy">My Submissions</h1>
          <p className="font-sans text-base text-psrr-slate">View and manage all your research papers and drafts.</p>
        </div>
        <Link 
          href="/scholar/submit"
          className="flex h-12 items-center justify-center rounded-lg bg-psrr-gold px-8 font-display text-sm font-bold text-psrr-white transition-all hover:bg-psrr-gold-accent active:scale-95 shadow-md"
        >
          New Submission
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        {papers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-psrr-border p-20 text-center">
            <p className="text-psrr-slate font-sans mb-4">You haven&apos;t submitted any research papers yet.</p>
            <Link href="/scholar/submit" className="text-psrr-gold font-bold hover:underline">Click here to start your first submission.</Link>
          </div>
        ) : (
          papers.map((paper) => (
            <div 
              key={paper.id}
              className={`flex flex-col gap-4 border-l-4 bg-psrr-white p-8 shadow-sm transition-all hover:shadow-md ${
                paper.status === 'PUBLISHED' ? 'border-emerald-500' : 
                paper.status === 'PENDING' ? 'border-psrr-gold' : 
                paper.status === 'RETURNED' ? 'border-rose-500' : 'border-psrr-navy'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                  paper.status === 'PENDING' ? 'bg-yellow-50 text-psrr-gold' : 
                  paper.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 
                  'bg-rose-50 text-rose-700'
                }`}>
                  {paper.status}
                </div>
                <span className="text-xs text-psrr-slate">
                  Submitted {new Date(paper.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="font-display text-xl font-bold text-psrr-navy">
                {paper.title}
              </h3>

              {paper.status === 'RETURNED' && paper.returnFeedback && (
                <div className="rounded-lg bg-rose-50 p-4 border border-rose-100 text-sm">
                  <p className="font-bold text-rose-700 mb-1">Feedback from Reviewer:</p>
                  <p className="text-rose-600 italic">&ldquo;{paper.returnFeedback}&rdquo;</p>
                </div>
              )}
              
              <div className="mt-2 flex items-center justify-between border-t border-psrr-border pt-4">
                <p className="font-sans text-xs text-psrr-slate">
                  {paper.fieldOfStudy} · {paper.year} · {paper.university}
                </p>
                <div className="flex gap-4">
                  <Link href={`/scholar/papers/${paper.id}`} className="text-sm font-bold text-psrr-navy-cta hover:underline">
                    View Details
                  </Link>
                  {paper.status === 'PUBLISHED' && (
                    <Link href={`/paper/${paper.id}`} className="text-sm font-bold text-psrr-navy-cta hover:underline border-l border-psrr-border pl-4">
                        View Public Page
                    </Link>
                  )}
                  {paper.status === 'RETURNED' && (
                    <Link href={`/scholar/submit?edit=${paper.id}`} className="text-sm font-bold text-psrr-gold hover:underline border-l border-psrr-border pl-4">
                        Revise & Resubmit
                    </Link>
                  )}
                  {paper.status !== 'PUBLISHED' && (
                    <div className="border-l border-psrr-border pl-4">
                      <DeletePaperButton paperId={paper.id} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
