import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, GraduationCap } from "lucide-react";
import UserActions from "../UserActions";
import CorrectionButton from "../CorrectionButton";

export default async function UserVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/403");
  }

  const user = await db.user.findUnique({
    where: { id },
    include: { scholarProfile: true },
  });

  if (!user) {
    notFound();
  }

  // REQ-3.2.2-3: Audit log for viewing Scholar PII
  if (user.role === "SCHOLAR") {
    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "VIEW_SCHOLAR_ID",
        // The user's name is PII — the log records the account ID, not the name.
        detail: `Viewed SPAS verification for scholar account ${user.id}`
      }
    });
  }

  let decryptedSpasId = "";
  let decryptedFullName = "";
  let spasRecord = null;

  if (user.role === "SCHOLAR" && user.scholarProfile) {
    try {
      decryptedSpasId = decryptField(user.scholarProfile.spasId);
      decryptedFullName = decryptField(user.scholarProfile.fullName);
      
      // Look up SPAS database record
      spasRecord = await db.spasRecord.findUnique({
        where: { spasId: decryptedSpasId }
      });
    } catch (e) {
      console.error("Decryption error:", e);
    }
  }

  const isMatched = spasRecord && 
    spasRecord.fullName.toLowerCase() === decryptedFullName.toLowerCase();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <Link 
        href="/admin/users" 
        className="mb-6 flex w-fit items-center gap-2 text-sm font-bold text-psrr-slate hover:text-psrr-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to User Management
      </Link>

      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold text-psrr-navy">Verify Scholar Account</h1>
        <p className="mt-2 text-psrr-slate">Compare submitted data with official SPAS records to authorize this account.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Scholar Submitted Data */}
        <div className="rounded-xl border border-psrr-border bg-white p-8 shadow-sm">
          <h2 className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">
            Scholar Submitted Data
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">Full Name</label>
              <p className="text-lg font-bold text-psrr-navy">{decryptedFullName || user.name || "N/A"}</p>
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">SPAS ID</label>
              <p className="font-mono text-sm font-bold text-psrr-navy">{decryptedSpasId || "N/A"}</p>
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">Email Address</label>
              <p className="text-sm text-psrr-navy">{user.email}</p>
            </div>
            
            <div>
              <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">University</label>
              <p className="text-sm text-psrr-navy">{user.scholarProfile?.university || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* SPAS Database Record */}
        <div className="rounded-xl border border-psrr-border bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-psrr-slate">
              SPAS Database Record
            </h2>
            {isMatched ? (
              <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                <CheckCircle className="h-3 w-3" />
                ID MATCHED
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded bg-psrr-slate/10 px-2 py-1 text-[10px] font-bold text-psrr-slate">
                <AlertTriangle className="h-3 w-3" />
                NO EXACT MATCH
              </span>
            )}
          </div>

          {spasRecord ? (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">Full Name</label>
                <p className={`text-lg font-bold ${isMatched ? "text-emerald-600" : "text-psrr-navy"}`}>
                  {spasRecord.fullName}
                </p>
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-tighter text-psrr-slate">SPAS ID</label>
                <p className="font-mono text-sm font-bold text-emerald-600">{spasRecord.spasId}</p>
              </div>
              
              <div className="rounded-lg bg-psrr-surface p-4 text-xs text-psrr-slate">
                <p>Official records from DOST-SEI database match the provided SPAS ID.</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-psrr-slate opacity-30" />
              <p className="text-sm font-medium text-psrr-slate">No SPAS record found for ID: {decryptedSpasId}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-6 border-t border-psrr-border pt-10">
        <div>
          <h2 className="text-sm font-bold text-psrr-navy mb-2">Account Status & Controls</h2>
          <p className="text-xs text-psrr-slate mb-4">
            Verification is the process of matching the scholar&apos;s data with DOST-SEI records. 
            Activation actually grants the user access to scholar features.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <UserActions userId={user.id} isActive={user.isActive} />
          <CorrectionButton userId={user.id} />
        </div>
      </div>
    </div>
  );
}
