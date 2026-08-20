import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { Paper } from "@prisma/client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function Home() {
  const [totalPapers, totalRegions, totalScholars, trendingPapers] = await Promise.all([
    db.paper.count({ where: { status: "PUBLISHED" } }),
    db.paper.groupBy({ by: ["region"], where: { status: "PUBLISHED" } }).then(res => res.length),
    db.user.count({ where: { role: "SCHOLAR", isActive: true } }),
    db.paper.findMany({
      where: { status: "PUBLISHED" },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[800px] w-full items-center justify-center overflow-hidden px-8 py-20 lg:px-16">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1760456309390-d598c75c592e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Hero Background"
            fill
            className="object-cover"
            priority
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060E1E] via-[#0B3272cc] to-[#0B1F3A]" />
          <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-[#0B1F3Af5] via-[#0B32727d] to-[#0B1F3Ae8]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Hero Brand */}
          <div className="mb-12 flex flex-col items-center gap-4">
            <Image
              src="/sei-logo.png"
              alt="DOST-SEI"
              width={80}
              height={80}
              className="h-20 w-20"
            />
            <p className="font-sans text-sm font-extrabold leading-tight text-white uppercase tracking-wider">
              Department of Science and Technology
              <br />
              Science Education Institute
            </p>
          </div>

          <h1 className="max-w-4xl font-display text-5xl font-bold leading-tight text-white lg:text-7xl">
            Patriot Scholars
            <br />
            Research Repository
          </h1>
          
          <p className="mt-8 max-w-xl font-sans text-lg text-[#8EC4E8]">
            Explore the research repository of the nation&apos;s brightest minds.
          </p>

          {/* Search Bar */}
          <form action="/search" method="GET" className="mt-12 flex h-16 w-full max-w-2xl items-center justify-between gap-4 rounded-full bg-white p-2 pl-8 shadow-2xl">
            <div className="flex flex-1 items-center gap-4">
              <svg
                className="h-6 w-6 text-psrr-slate-light"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                name="q"
                type="text"
                placeholder="Search by title, author, or keyword..."
                className="w-full font-sans text-base text-psrr-navy placeholder-psrr-slate-light outline-none"
              />
            </div>
            <button type="submit" className="flex h-full items-center justify-center rounded-full bg-psrr-navy-cta px-8 font-sans text-sm font-semibold text-white transition-all hover:bg-psrr-navy active:scale-95">
              Search
            </button>
          </form>
        </div>

        {/* Watermark Logo */}
        <div className="absolute -bottom-20 -right-20 z-1 h-[1000px] w-[1000px] opacity-[0.04]">
          <Image
            src="/psrr.svg"
            alt=""
            fill
            className="object-contain invert"
          />
        </div>
      </section>

      {/* Pulse Section */}
      <section className="mx-auto w-full max-w-7xl px-8 py-20 lg:px-16">
        <div className="flex w-full flex-col justify-between gap-12 rounded-[24px] bg-psrr-navy-cta px-10 py-12 text-center md:flex-row md:px-20 md:text-left shadow-xl">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="font-display text-5xl font-bold text-psrr-gold">{totalRegions}</span>
            <span className="font-sans text-xs font-bold tracking-widest text-white uppercase">REGIONS</span>
          </div>
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="font-display text-5xl font-bold text-[#8EC4E8]">{totalPapers}</span>
            <span className="font-sans text-xs font-bold tracking-widest text-white uppercase">PUBLISHED PAPERS</span>
          </div>
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="font-display text-5xl font-bold text-psrr-gold">{totalScholars}</span>
            <span className="font-sans text-xs font-bold tracking-widest text-white uppercase">ACTIVE SCHOLARS</span>
          </div>
        </div>
      </section>

      {/* Anchor Section */}
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-8 py-20 md:flex-row lg:px-16">
        <div className="flex flex-1 flex-col gap-6">
          <span className="font-display text-sm font-bold text-psrr-navy-cta opacity-40">01</span>
          <h2 className="font-display text-4xl font-bold leading-[1.1] text-psrr-navy">
            Bridging the gap between Local Research and Global Recognition.
          </h2>
          <p className="font-sans text-base leading-relaxed text-psrr-slate">
            Our repository serves as a centralized hub for Patriot Scholars to showcase their work, fostering collaboration across the archipelago.
          </p>
        </div>
        <div className="relative h-[400px] w-full max-w-[400px] shrink-0 overflow-hidden rounded-tr-[120px] shadow-lg">
          <Image
            src="/generated-1776048416778.png"
            alt="Collaboration"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0B327266] to-[#0B1F3Aaa]" />
        </div>
      </section>

      {/* Spotlight Section */}
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center gap-16 px-8 py-20 md:flex-row lg:px-16">
        <div className="relative h-[560px] w-full max-w-[440px] shrink-0 overflow-hidden rounded-tr-[80px] shadow-xl">
          <Image
            src="/generated-1776048636143.png"
            alt="Featured Research"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0B327266] to-[#0B1F3Aaa]" />
        </div>
        <div className="flex flex-1 flex-col gap-8">
          <span className="font-sans text-xs font-bold tracking-widest text-psrr-gold uppercase">FEATURED RESEARCH</span>
          <h2 className="font-display text-4xl font-bold leading-[1.1] text-psrr-navy">
            A Machine Learning Approach to Predicting Typhoon Intensity in the PAR
          </h2>
          <div className="flex items-center gap-4 font-sans text-sm">
            <span className="font-semibold text-psrr-navy">Maria Santos</span>
            <span className="text-psrr-slate-light">·</span>
            <span className="text-psrr-slate">UP Diliman</span>
            <span className="text-psrr-slate-light">·</span>
            <span className="text-psrr-slate">2024</span>
          </div>
          <p className="font-sans text-base leading-relaxed text-psrr-slate">
            Develops a deep learning model using LSTM networks to forecast typhoon intensity 24–72 hours in advance, providing crucial early warning data for coastal communities.
          </p>
          <Link href="/search" className="w-fit rounded-full bg-psrr-navy-cta px-8 py-3 font-sans text-sm font-semibold text-white transition-all hover:bg-psrr-navy shadow-md">
            Browse All Papers
          </Link>
        </div>
      </section>

      {/* Trending Section */}
      <section className="mx-auto w-full max-w-7xl px-8 py-20 lg:px-16">
        <h2 className="mb-12 font-display text-4xl font-bold text-psrr-navy">Latest Submissions</h2>
        <div className="flex flex-col border-t-2 border-psrr-navy">
          {trendingPapers.length === 0 ? (
            <p className="py-12 text-psrr-slate italic">No published papers yet.</p>
          ) : (
            trendingPapers.map((paper: Paper, index: number) => (
              <Link
                key={paper.id}
                href={`/paper/${paper.id}`}
                className="group flex items-center justify-between border-b border-psrr-border py-8 transition-colors hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-8">
                  <span className="font-display text-2xl font-bold text-psrr-slate-light">0{index + 1}</span>
                  <h3 className="font-display text-xl font-bold text-psrr-navy group-hover:text-psrr-navy-cta transition-colors">
                    {paper.title}
                  </h3>
                </div>
                <div className="flex items-center gap-12">
                  <div className="hidden items-center gap-3 md:flex">
                    <span className="font-sans text-[13px] font-semibold text-psrr-navy-cta">{paper.region}</span>
                    <span className="text-psrr-slate-light">·</span>
                    <span className="font-sans text-[13px] text-psrr-slate">{paper.year}</span>
                  </div>
                  <svg
                    className="h-6 w-6 text-psrr-navy transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
