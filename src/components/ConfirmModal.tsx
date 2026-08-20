"use client"

import Modal from "./Modal";
import { AlertCircle, HelpCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "info",
  isLoading = false
}: ConfirmModalProps) {
  
  const isDanger = type === "danger";
  const Icon = isDanger ? AlertCircle : HelpCircle;
  const iconColor = isDanger ? "text-rose-600" : "text-psrr-gold";
  const bgColor = isDanger ? "bg-rose-50" : "bg-psrr-gold/5";
  const confirmBtnClass = isDanger 
    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" 
    : "bg-psrr-navy hover:bg-psrr-navy-cta shadow-psrr-navy/20";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgColor} ${iconColor}`}>
          <Icon className="h-8 w-8" />
        </div>
        <p className="mb-8 text-sm leading-relaxed text-psrr-slate">
          {message}
        </p>
        <div className="flex w-full gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-psrr-surface py-3 text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-border disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${confirmBtnClass}`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
