"use client"

import { useState } from "react";
import { requestCorrection } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import AlertDialog from "@/components/AlertDialog";
import { useToast } from "@/components/Toast";

export default function CorrectionButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleAction = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await requestCorrection(userId);
      showToast("Correction request sent successfully.", "success");
    } catch (error) {
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        disabled={loading}
        onClick={() => setShowConfirm(true)}
        className="text-sm font-bold transition-all text-psrr-slate hover:text-psrr-navy disabled:opacity-50"
      >
        {loading ? "Sending..." : "Request Correction"}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleAction}
        title="Request Correction"
        message="Send a correction request email to this scholar? This will notify them that their profile needs updates."
        confirmLabel="Send Request"
        isLoading={loading}
      />

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Error"
        message="Failed to send correction request. Please try again later."
        type="error"
      />
    </>
  );
}
