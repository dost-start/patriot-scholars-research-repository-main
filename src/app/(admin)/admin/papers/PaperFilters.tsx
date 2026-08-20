"use client"

import { Search, Clock, Filter, X, ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const STATUSES = [
  { label: "All Submissions", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Returned", value: "RETURNED" },
];

interface StatusOption {
  label: string;
  value: string;
}

export default function PaperFilters({ 
  initialQuery, 
  initialStatus, 
  pendingCount 
}: { 
  initialQuery: string; 
  initialStatus: string; 
  pendingCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialQuery) {
        updateFilters("q", query);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, initialQuery]);

  const updateFilters = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.delete("page");
    router.push(`/admin/papers?${params.toString()}`);
  };

  const currentStatus = searchParams.get("status") || "";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Row: Status Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-psrr-border pb-1">
        <div className="flex gap-8">
          {STATUSES.map((status: StatusOption) => (
            <button
              key={status.value}
              onClick={() => updateFilters("status", status.value)}
              className={`relative pb-4 text-sm font-bold transition-all ${
                currentStatus === status.value
                  ? "text-psrr-navy"
                  : "text-psrr-slate hover:text-psrr-navy"
              }`}
            >
              {status.label}
              {status.value === "PENDING" && pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-psrr-gold px-1.5 py-0.5 text-[10px] text-white">
                  {pendingCount}
                </span>
              )}
              {currentStatus === status.value && (
                <div className="absolute bottom-0 left-0 h-1 w-full rounded-t-full bg-psrr-navy" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Row: Search and Secondary Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-psrr-slate" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by paper title or scholar name..."
            className="h-12 w-full rounded-xl border border-psrr-border bg-white pl-12 pr-4 font-sans text-sm text-psrr-navy outline-none transition-all focus:border-psrr-navy focus:ring-1 focus:ring-psrr-navy placeholder:text-psrr-slate-light"
          />
          {query && (
            <button 
              onClick={() => { setQuery(""); updateFilters("q", ""); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-psrr-slate hover:text-psrr-navy"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-psrr-surface border border-psrr-border text-psrr-navy">
            <Filter className="h-4 w-4 text-psrr-slate" />
            <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>

          <div className="relative">
            <select
              value={searchParams.get("region") || ""}
              onChange={(e) => updateFilters("region", e.target.value)}
              className="h-12 appearance-none rounded-xl border border-psrr-border bg-white pl-4 pr-10 font-sans text-sm font-semibold text-psrr-navy outline-none focus:border-psrr-navy"
            >
              <option value="">All Regions</option>
              <option>NCR</option>
              <option>Region I</option>
              <option>Region II</option>
              <option>Region III</option>
              <option>Region IV-A</option>
              <option>Region IV-B</option>
              <option>Region V</option>
              <option>Region VI</option>
              <option>Region VII</option>
              <option>Region VIII</option>
              <option>Region IX</option>
              <option>Region X</option>
              <option>Region XI</option>
              <option>Region XII</option>
              <option>CARAGA</option>
              <option>BARMM</option>
              <option>CAR</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-psrr-slate" />
          </div>

          <div className="relative">
            <select
              value={searchParams.get("field") || ""}
              onChange={(e) => updateFilters("field", e.target.value)}
              className="h-12 appearance-none rounded-xl border border-psrr-border bg-white pl-4 pr-10 font-sans text-sm font-semibold text-psrr-navy outline-none focus:border-psrr-navy"
            >
              <option value="">All Fields</option>
              <option value="B.S. COMPUTER SCIENCE">Computer Science</option>
              <option value="B.S. BIOLOGY">Biology</option>
              <option value="B.S. PHYSICS">Physics</option>
              <option value="B.S. MATHEMATICS">Mathematics</option>
              <option value="B.S. APPLIED PHYSICS">Applied Physics</option>
              <option value="B.S. CHEMISTRY">Chemistry</option>
              <option value="B.S. MARINE SCIENCE">Marine Science</option>
              <option value="ENGINEERING">Engineering</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-psrr-slate" />
          </div>

          <button 
            onClick={() => router.push("/admin/papers")}
            className="h-12 px-4 text-sm font-bold text-psrr-navy-cta hover:underline"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
