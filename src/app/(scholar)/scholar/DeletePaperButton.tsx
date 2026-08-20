"use client"

import { useState } from "react";
import { deletePaperAction } from "./submit/actions";
import { Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import AlertDialog from "@/components/AlertDialog";
import { useToast } from "@/components/Toast";

export default function DeletePaperButton({ paperId }: { paperId: string }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleAction = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await deletePaperAction(paperId);
      showToast("Paper deleted successfully.", "success");
    } catch (error) {
      setShowAlert(true);
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        disabled={loading}
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
        {loading ? "Deleting..." : "Delete Draft"}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleAction}
        title="Delete Submission"
        message="Are you sure you want to delete this submission? This action cannot be undone."
        confirmLabel="Delete"
        type="danger"
        isLoading={loading}
      />

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Error"
        message="Failed to delete paper. Please try again later."
        type="error"
      />
    </>
  );
}
