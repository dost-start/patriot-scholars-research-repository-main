"use client"

import { useState } from "react";
import { reviewPaper } from "./actions";
import { CheckCircle, X, Loader2, AlertCircle } from "lucide-react";
import AlertDialog from "@/components/AlertDialog";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

export default function ReviewActions({ paperId, currentStatus }: { paperId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { showToast } = useToast();
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type: "info" | "success" | "error" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, onConfirm: () => void }>({
    isOpen: false,
    onConfirm: () => {}
  });

  const showAlert = (title: string, message: string, type: "info" | "success" | "error" = "info") => {
    setAlertConfig({ isOpen: true, title, message, type });
  };

  const handleReview = async (status: "PUBLISHED" | "RETURNED" | "REJECTED") => {
    if ((status === "RETURNED" || status === "REJECTED") && !feedback.trim()) {
      showAlert("Feedback Required", "Please provide feedback for the scholar explaining this decision.", "error");
      return;
    }

    if (status === "REJECTED") {
      setConfirmConfig({
        isOpen: true,
        onConfirm: () => executeReview(status)
      });
      return;
    }

    executeReview(status);
  };

  const executeReview = async (status: "PUBLISHED" | "RETURNED" | "REJECTED") => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    setLoading(true);
    try {
      await reviewPaper(paperId, status, feedback);
      if (status !== "PUBLISHED") {
        setFeedback("");
      }
      showToast(`Paper has been ${status.toLowerCase()} successfully.`, "success");
    } catch (error) {
      showAlert("Error", "Failed to review paper. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-l-4 border-l-psrr-navy bg-white p-6 shadow-sm border-y border-r border-psrr-border flex flex-col gap-5 sticky top-24">
      <h2 className="text-[11px] font-bold text-psrr-slate uppercase tracking-[0.2em]">Admin Decision</h2>
      
      <div className="h-px bg-psrr-border w-full" />

      {/* Status Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-psrr-slate uppercase">Current Status</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          currentStatus === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" :
          currentStatus === "PENDING" ? "bg-psrr-gold/10 text-psrr-gold" :
          currentStatus === "REJECTED" ? "bg-rose-100 text-rose-700" :
          "bg-psrr-surface text-psrr-slate"
        }`}>
          {currentStatus}
        </span>
      </div>

      {/* Approve Button */}
      <button 
        disabled={loading || currentStatus === "PUBLISHED" || currentStatus === "REJECTED"}
        onClick={() => handleReview("PUBLISHED")}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-psrr-navy px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-psrr-navy-light active:scale-95 disabled:opacity-50 disabled:grayscale"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Approve & Publish
      </button>

      <div className="h-px bg-psrr-border w-full my-2" />

      {/* Return Section */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-psrr-slate uppercase">Review Feedback</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Explain the decision (required for return/rejection)..."
          className="min-h-[120px] w-full rounded-xl border border-psrr-border bg-psrr-surface p-4 text-xs text-psrr-navy outline-none transition-all focus:border-psrr-gold focus:ring-1 focus:ring-psrr-gold"
        />
        
        <div className="grid grid-cols-1 gap-3">
          <button 
            disabled={loading || !feedback.trim() || currentStatus === "PUBLISHED" || currentStatus === "REJECTED"}
            onClick={() => handleReview("RETURNED")}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-psrr-gold bg-transparent px-6 py-3 text-sm font-bold text-psrr-gold transition-all hover:bg-psrr-gold/5 active:scale-95 disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Return for Revision
          </button>

          <button 
            disabled={loading || !feedback.trim() || currentStatus === "PUBLISHED" || currentStatus === "REJECTED"}
            onClick={() => handleReview("REJECTED")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-50 px-6 py-3 text-sm font-bold text-rose-600 transition-all hover:bg-rose-100 active:scale-95 disabled:opacity-30"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            Permanent Reject
          </button>
        </div>
      </div>

      <p className="mt-4 text-[10px] italic leading-tight text-psrr-slate text-center">
        Returned papers allow revision. Rejected papers are permanently closed.
      </p>

      {/* Custom Dialogs */}
      <AlertDialog
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title="Confirm Rejection"
        message="Are you sure you want to PERMANENTLY reject this paper? The scholar will not be able to resubmit it."
        type="danger"
        confirmLabel="Permanent Reject"
      />
    </div>
  );
}
