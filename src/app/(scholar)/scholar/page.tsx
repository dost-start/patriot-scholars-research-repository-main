import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeletePaperButton from "./DeletePaperButton";

import { Metadata } from "next";
import { Paper } from "@prisma/client";

export const metadata: Metadata = {
  title: "Scholar Dashboard",
};

export default async function ScholarDashboard() {
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

  const stats = {
    total: papers.length,
    published: papers.filter((p) => p.status === "PUBLISHED").length,
    pending: papers.filter((p) => p.status === "PENDING").length,
    returned: papers.filter((p) => p.status === "RETURNED").length,
  };

  // Only show the 3 most recent submissions on the dashboard
  const recentPapers = papers.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-16">
      {/* Header Row */}
      <div className="mb-12 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold text-psrr-navy">Scholar Dashboard</h1>
          <p className="font-sans text-base text-psrr-slate">Manage your research submissions and track their status.</p>
        </div>
        <Link 
          href="/scholar/submit"
          className="flex h-12 items-center justify-center rounded-lg bg-psrr-gold px-8 font-display text-sm font-bold text-psrr-white transition-all hover:bg-psrr-gold-accent active:scale-95 shadow-md"
        >
          New Submission
        </Link>
      </div>

      {/* Stats Row */}
      <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Submitted", value: stats.total, color: "text-psrr-navy" },
          { label: "Published", value: stats.published, color: "text-emerald-600" },
          { label: "Pending Review", value: stats.pending, color: "text-psrr-gold", highlight: stats.pending > 0 },
          { label: "Returned", value: stats.returned, color: "text-rose-600", highlight: stats.returned > 0 },
        ].map((stat) => (
          <div 
            key={stat.label} 
            className={`flex flex-col gap-3 rounded-lg bg-psrr-white p-6 shadow-sm border-l-4 ${stat.highlight ? 'border-psrr-gold' : 'border-psrr-border'}`}
          >
            <span className="font-sans text-[10px] font-bold tracking-widest text-psrr-slate-light uppercase">
              {stat.label}
            </span>
            <span className={`font-display text-4xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* List Area - Recent Only */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-psrr-border pb-4">
          <h2 className="font-display text-xl font-bold text-psrr-navy">Recent Submissions</h2>
          {papers.length > 3 && (
            <Link href="/scholar/submissions" className="text-sm font-bold text-psrr-navy-cta hover:underline">
              View All Submissions →
            </Link>
          )}
        </div>
        
        {papers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-psrr-border p-20 text-center">
            <p className="text-psrr-slate font-sans mb-4">You haven&apos;t submitted any research papers yet.</p>
            <Link href="/scholar/submit" className="text-psrr-gold font-bold hover:underline">Click here to start your first submission.</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6">
              {recentPapers.map((paper) => (
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
                      <p className="text-rose-600 italic">"{paper.returnFeedback}"</p>
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
              ))}
            </div>
            {papers.length > 3 && (
              <div className="mt-4 text-center">
                <Link 
                  href="/scholar/submissions"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-psrr-navy-cta px-6 font-display text-xs font-bold text-psrr-navy-cta transition-all hover:bg-psrr-navy-cta hover:text-psrr-white"
                >
                  View All Submissions
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
