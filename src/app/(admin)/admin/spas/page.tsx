import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Database, Upload, Plus, Search, Trash2, Edit2, Calendar, User } from "lucide-react";
import Link from "next/link";
import SpasImportForm from "./SpasImportForm";
import SpasManualForm from "./SpasManualForm";
import { deleteSpasRecord } from "./actions";
import { SpasRecord } from "@prisma/client";

import { Metadata } from "next";

export default async function AdminSpasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  const spasRecords = await db.spasRecord.findMany({
    where: query ? {
      OR: [
        { spasId: { contains: query, mode: "insensitive" as const } },
        { fullName: { contains: query, mode: "insensitive" as const } },
      ]
    } : {},
    orderBy: { fullName: "asc" },
    take: 100, // Limit for performance, in a real app we'd add pagination
  });

  const totalRecords = await db.spasRecord.count();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-psrr-navy">SPAS Scholar Records</h1>
          <p className="mt-2 text-psrr-slate">Manage the master list of DOST-SEI scholars used for registration verification.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <SpasImportForm />
          <SpasManualForm />
        </div>
      </header>

      {/* Stats and Search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-psrr-navy/10 px-4 py-2 text-psrr-navy">
          <Database className="h-4 w-4" />
          <span className="text-sm font-bold">{totalRecords.toLocaleString()} Total Records</span>
        </div>

        <form className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-psrr-slate" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by name or SPAS ID..."
            className="w-full rounded-lg border border-psrr-border bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-psrr-navy focus:ring-2 focus:ring-psrr-navy/10"
          />
        </form>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border-l-4 border-l-psrr-navy bg-white shadow-sm border-y border-r border-psrr-border">
        {/* Table Header */}
        <div className="flex items-center gap-6 bg-psrr-surface px-6 py-4 border-b border-psrr-border">
          <div className="w-[180px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">SPAS ID</div>
          <div className="flex-1 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Full Name</div>
          <div className="w-[180px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Birthdate</div>
          <div className="w-[100px] shrink-0 text-right text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-psrr-border">
          {spasRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <Database className="h-12 w-12 text-psrr-border mb-4" />
              <p className="text-sm text-psrr-slate italic">No records found. Import a CSV or add manually.</p>
            </div>
          ) : (
            spasRecords.map((record: SpasRecord) => (
              <div key={record.id} className="group flex items-center gap-6 px-6 py-5 transition-colors hover:bg-psrr-surface">
                <div className="w-[180px] shrink-0">
                  <span className="font-mono text-sm font-bold text-psrr-navy bg-psrr-surface px-2 py-0.5 rounded">
                    {record.spasId}
                  </span>
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  <div className="rounded-full bg-psrr-navy/5 p-2 text-psrr-navy">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-psrr-navy">{record.fullName}</span>
                </div>

                <div className="w-[180px] shrink-0 flex items-center gap-2 text-sm text-psrr-slate">
                  <Calendar className="h-4 w-4 text-psrr-slate-light" />
                  {new Date(record.birthdate).toLocaleDateString("en-US", { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>

                <div className="w-[100px] shrink-0 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SpasManualForm record={record} />
                  <form action={async () => {
                    "use server"
                    await deleteSpasRecord(record.id);
                  }}>
                    <button 
                      type="submit"
                      className="rounded-lg p-2 text-psrr-slate hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {spasRecords.length > 0 && (
          <div className="bg-psrr-surface px-6 py-4 border-t border-psrr-border flex items-center justify-between">
            <span className="text-xs text-psrr-slate italic">
              Showing {spasRecords.length} of {totalRecords} records
            </span>
            {totalRecords > 100 && (
              <span className="text-[10px] font-bold text-psrr-navy-cta uppercase tracking-widest">
                Search to find specific records
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
