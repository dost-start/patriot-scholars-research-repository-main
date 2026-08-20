"use client"

import Modal from "./Modal";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "error";
  confirmLabel?: string;
}

export default function AlertDialog({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = "info",
  confirmLabel = "Understand"
}: AlertDialogProps) {
  
  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;
  const iconColor = type === "success" ? "text-emerald-500" : type === "error" ? "text-rose-500" : "text-psrr-gold";
  const bgColor = type === "success" ? "bg-emerald-50" : type === "error" ? "bg-rose-50" : "bg-psrr-gold/5";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center">
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgColor} ${iconColor}`}>
          <Icon className="h-8 w-8" />
        </div>
        <p className="mb-8 text-sm leading-relaxed text-psrr-slate">
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-psrr-navy py-3 text-sm font-bold text-white shadow-lg shadow-psrr-navy/20 transition-all hover:bg-psrr-navy-cta active:scale-95"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
