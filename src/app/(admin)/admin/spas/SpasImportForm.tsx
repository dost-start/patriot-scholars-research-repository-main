"use client"

import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { importSpasCsv } from "./actions";
import Modal from "@/components/Modal";

export default function SpasImportForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Please upload a CSV file.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsPending(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await importSpasCsv(formData);
      setResult(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setIsPending(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setFile(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-psrr-border bg-white px-4 py-2 text-sm font-bold text-psrr-navy shadow-sm transition-all hover:bg-psrr-surface active:scale-95"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </button>

      <Modal isOpen={isOpen} onClose={close} title="Import Scholar Records">
        <p className="mb-6 text-sm text-psrr-slate leading-relaxed">
          Upload a CSV file with DOST-SEI scholar records. The file should have headers: <br />
          <code className="mt-2 block rounded bg-psrr-surface p-2 font-mono text-[11px] font-bold text-psrr-navy uppercase tracking-wider">
            spasId, fullName, birthdate (YYYY-MM-DD)
          </code>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer ${
              file ? "border-psrr-navy bg-psrr-navy/5" : "border-psrr-border hover:border-psrr-navy/30 hover:bg-psrr-surface"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            {file ? (
              <>
                <FileText className="h-10 w-10 text-psrr-navy mb-3" />
                <p className="text-sm font-bold text-psrr-navy">{file.name}</p>
                <p className="text-xs text-psrr-slate mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-psrr-slate-light mb-3" />
                <p className="text-sm font-bold text-psrr-navy">Click to select CSV file</p>
                <p className="text-xs text-psrr-slate mt-1">or drag and drop here</p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-xs font-bold text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Successfully imported {result.count} records.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl bg-psrr-surface py-3 text-sm font-bold text-psrr-navy transition-all hover:bg-psrr-border"
            >
              {result ? "Close" : "Cancel"}
            </button>
            {!result && (
              <button
                type="submit"
                disabled={!file || isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-psrr-navy-cta py-3 text-sm font-bold text-white shadow-lg shadow-psrr-navy-cta/20 transition-all hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Start Import"
                )}
              </button>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}
