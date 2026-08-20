"use client"

import { useState } from "react";
import { Plus, X, Loader2, AlertCircle, Edit2 } from "lucide-react";
import { upsertSpasRecord } from "./actions";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { SpasRecord } from "@prisma/client";

export default function SpasManualForm({ record }: { record?: SpasRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const isEdit = !!record;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const spasId = formData.get("spasId") as string;
    const fullName = formData.get("fullName") as string;
    const birthdateStr = formData.get("birthdate") as string;

    if (!spasId || !fullName || !birthdateStr) {
      setError("All fields are required.");
      setIsPending(false);
      return;
    }

    try {
      await upsertSpasRecord({
        id: record?.id,
        spasId,
        fullName,
        birthdate: new Date(birthdateStr),
      });
      showToast(`Scholar record ${isEdit ? "updated" : "saved"} successfully.`, "success");
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-psrr-slate hover:bg-psrr-surface hover:text-psrr-navy transition-colors"
          title="Edit record"
        >
          <Edit2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-psrr-navy-cta px-4 py-2 text-sm font-bold text-white shadow-lg shadow-psrr-navy-cta/20 transition-all hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      )}

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={isEdit ? "Edit Scholar Record" : "Add Scholar Record"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="spasId" className="text-xs font-bold uppercase tracking-widest text-psrr-slate">SPAS ID</label>
            <input
              type="text"
              id="spasId"
              name="spasId"
              defaultValue={record?.spasId}
              required
              placeholder="e.g. 2024-XXXX"
              className="w-full rounded-xl border border-psrr-border bg-white px-4 py-3 text-sm outline-none transition-all focus:border-psrr-navy focus:ring-4 focus:ring-psrr-navy/5"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-psrr-slate">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              defaultValue={record?.fullName}
              required
              placeholder="e.g. JUAN DELA CRUZ"
              className="w-full rounded-xl border border-psrr-border bg-white px-4 py-3 text-sm outline-none transition-all focus:border-psrr-navy focus:ring-4 focus:ring-psrr-navy/5"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="birthdate" className="text-xs font-bold uppercase tracking-widest text-psrr-slate">Birthdate</label>
            <input
              type="date"
              id="birthdate"
              name="birthdate"
              defaultValue={record?.birthdate ? new Date(record.birthdate).toISOString().split('T')[0] : ""}
              required
              className="w-full rounded-xl border border-psrr-border bg-white px-4 py-3 text-sm outline-none transition-all focus:border-psrr-navy focus:ring-4 focus:ring-psrr-navy/5"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-xs font-bold text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-xl bg-psrr-surface py-3 text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-psrr-navy-cta py-3 text-sm font-bold text-white shadow-lg shadow-psrr-navy-cta/20 transition-all hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? "Update Record" : "Save Record"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
