"use client"

import { useState } from "react";
import { toggleUserStatus } from "./actions";
import { useRouter, usePathname } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import AlertDialog from "@/components/AlertDialog";
import { useToast } from "@/components/Toast";

export default function UserActions({ userId, isActive }: { userId: string, isActive: boolean }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // If we are on the list page, "Manage/Verify" should navigate to the detail page.
  // If we are on the detail page, "Verify & Activate" / "Deactivate" should perform the action.
  const isDetailPage = pathname.includes(`/admin/users/${userId}`);

  const handleAction = async () => {
    if (!isDetailPage) {
      router.push(`/admin/users/${userId}`);
      return;
    }

    setShowConfirm(true);
  };

  const executeAction = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      await toggleUserStatus(userId, isActive);
      showToast(`User account ${isActive ? "deactivated" : "activated"} successfully.`, "success");
      router.refresh();
      if (!isActive) {
        router.push("/admin/users");
      }
    } catch (error) {
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const actionName = isActive ? "Deactivate" : "Activate";

  return (
    <>
      <button 
        disabled={loading}
        onClick={handleAction}
        className="rounded bg-psrr-navy px-6 py-2 text-[11px] font-bold text-white transition-colors hover:bg-psrr-navy/90 disabled:opacity-50"
      >
        {loading ? "..." : 
         isDetailPage ? (isActive ? "Deactivate Account" : "Verify & Activate Account") : 
         (isActive ? "Manage" : "Verify")}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeAction}
        title={`${actionName} Account`}
        message={`Are you sure you want to ${actionName.toLowerCase()} this account? ${isActive ? "The user will lose access to the system." : "The user will be notified and granted access."}`}
        confirmLabel={actionName}
        type={isActive ? "danger" : "info"}
        isLoading={loading}
      />

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Error"
        message="Failed to update user status. Please try again later."
        type="error"
      />
    </>
  );
}
