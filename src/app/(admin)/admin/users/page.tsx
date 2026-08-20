import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import UserActions from "./UserActions";
import { decryptField } from "@/lib/crypto";
import { Users, Shield, GraduationCap } from "lucide-react";

import { Metadata } from "next";
import { Prisma } from "@prisma/client";

interface UserWithProfile extends Prisma.UserGetPayload<{ include: { scholarProfile: true } }> {}

export const metadata: Metadata = {
  title: "Manage Users",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { scholarProfile: true },
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-psrr-navy">User Management</h1>
          <p className="mt-2 text-psrr-slate">View, verify, and manage all registered accounts across the platform.</p>
        </div>
        <div className="flex h-10 w-fit items-center gap-2 rounded-lg bg-psrr-navy/10 px-4 text-psrr-navy">
          <Users className="h-4 w-4" />
          <span className="text-sm font-bold">{users.length} Total Users</span>
        </div>
      </header>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border-l-4 border-l-psrr-navy bg-white shadow-sm border-y border-r border-psrr-border">
        {/* Table Header */}
        <div className="flex items-center gap-6 bg-psrr-surface px-6 py-4 border-b border-psrr-border">
          <div className="flex-1 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">User Details</div>
          <div className="w-[300px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Verification Details (Scholars)</div>
          <div className="w-[120px] shrink-0 text-center text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Status</div>
          <div className="w-[100px] shrink-0 text-right text-[11px] font-bold uppercase tracking-widest text-psrr-slate">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-psrr-border">
          {users.map((user: UserWithProfile) => {
            let decryptedSpasId = "";
            if (user.role === "SCHOLAR" && user.scholarProfile?.spasId) {
              try {
                decryptedSpasId = decryptField(user.scholarProfile.spasId);
              } catch (e) {
                decryptedSpasId = "Decryption Error";
              }
            }

            return (
              <div key={user.id} className="group flex items-center gap-6 px-6 py-5 transition-colors hover:bg-psrr-surface">
                {/* User Info */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-psrr-navy">{user.name || "N/A"}</span>
                    {user.role === "ADMIN" ? (
                      <Shield className="h-3 w-3 text-psrr-navy-cta" />
                    ) : user.role === "SCHOLAR" ? (
                      <GraduationCap className="h-3.5 w-3.5 text-psrr-slate" />
                    ) : null}
                  </div>
                  <span className="text-xs text-psrr-slate">{user.email}</span>
                  <div className="mt-1 flex gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter ${
                      user.role === "ADMIN" ? "bg-psrr-navy-cta/10 text-psrr-navy-cta" :
                      user.role === "SCHOLAR" ? "bg-slate-100 text-psrr-navy" :
                      "bg-slate-100 text-psrr-slate"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Scholar Details */}
                <div className="w-[300px] shrink-0">
                  {user.role === "SCHOLAR" && user.scholarProfile ? (
                    <div className="flex flex-col gap-1 text-[11px]">
                      <div className="flex gap-2">
                        <span className="font-bold text-psrr-slate w-12 shrink-0">SPAS:</span>
                        <span className="font-mono font-bold text-psrr-navy bg-psrr-surface px-1.5 rounded">{decryptedSpasId}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-psrr-slate w-12 shrink-0">UNIV:</span>
                        <span className="text-psrr-navy truncate">{user.scholarProfile.university || "Pending"}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-psrr-slate w-12 shrink-0">REG:</span>
                        <span className="text-psrr-navy">{user.scholarProfile.region || "Pending"}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-psrr-slate italic opacity-50">N/A (Public User)</span>
                  )}
                </div>

                {/* Status */}
                <div className="w-[120px] shrink-0 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-psrr-slate animate-pulse"}`} />
                    <span className="text-xs font-bold text-psrr-slate">
                      {user.isActive ? "ACTIVE" : "PENDING"}
                    </span>
                  </div>
                  <span className="text-[10px] text-psrr-slate font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="w-[100px] shrink-0 text-right">
                   <UserActions userId={user.id} isActive={user.isActive} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-psrr-surface px-6 py-4 border-t border-psrr-border">
          <span className="text-xs text-psrr-slate italic">Total registered accounts: {users.length}</span>
        </div>
      </div>
    </div>
  );
}
