import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GraduationCap, MapPin, FileText, Download, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import { Paper, User, ScholarProfile } from "@prisma/client";

type ScholarWithPapers = User & {
  scholarProfile: ScholarProfile | null;
  papers: (Paper & { _count: { downloads: number } })[];
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: { name: true }
  });

  if (!user) {
    return { title: "Scholar Not Found" };
  }

  return {
    title: `${user.name} | Patriot Scholars Research Repository`,
  };
}

export default async function ScholarProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const scholar = (await db.user.findUnique({
    where: { id },
    include: { 
      scholarProfile: true,
      papers: {
        where: { status: "PUBLISHED" },
        include: { _count: { select: { downloads: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  })) as ScholarWithPapers | null;

  if (!scholar || scholar.role !== "SCHOLAR") {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-8 py-12 lg:px-16">
      {/* Profile Header */}
      <div className="mb-12 flex flex-col gap-8 rounded-2xl bg-psrr-navy p-10 text-psrr-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-psrr-gold text-psrr-navy font-display text-2xl font-bold">
            {scholar.name[0]}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-bold lg:text-4xl">{scholar.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-psrr-slate-light">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                <span className="text-sm font-medium">{scholar.scholarProfile?.university || "Scholar"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{scholar.scholarProfile?.region || "PH"}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-col items-center rounded-xl bg-psrr-white/5 p-4 text-center min-w-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-psrr-gold">PUBLISHED</span>
            <span className="text-2xl font-bold">{scholar.papers.length}</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-psrr-white/5 p-4 text-center min-w-[100px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-psrr-gold">DOWNLOADS</span>
            <span className="text-2xl font-bold">
              {scholar.papers.reduce((acc: number, p) => acc + (p._count?.downloads || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <h2 className="font-display text-2xl font-bold text-psrr-navy border-b border-psrr-border pb-4">
          Published Research
        </h2>

        {scholar.papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-psrr-slate">
            <FileText className="h-12 w-12 opacity-20 mb-4" />
            <p className="font-sans text-lg italic">No published papers yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {scholar.papers.map((paper) => (
              <Link 
                key={paper.id} 
                href={`/paper/${paper.id}`}
                className="group flex flex-col gap-4 rounded-xl border border-psrr-border bg-white p-6 shadow-sm transition-all hover:border-psrr-navy-cta hover:shadow-md"
              >
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-psrr-gold">{paper.fieldOfStudy}</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-psrr-slate">
                    <Download className="h-3 w-3" />
                    {paper._count.downloads}
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold text-psrr-navy group-hover:text-psrr-navy-cta transition-colors line-clamp-2">
                  {paper.title}
                </h3>
                <p className="font-sans text-[13px] text-psrr-slate line-clamp-3 leading-relaxed">
                  {paper.abstract}
                </p>
                <div className="mt-2 flex items-center justify-between pt-2 border-t border-psrr-border/50">
                  <span className="text-xs font-medium text-psrr-slate">{paper.year}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-psrr-navy-cta">
                    View Paper <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
