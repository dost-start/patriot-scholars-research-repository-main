"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitPaper } from "./actions";
import { getPaperForEdit } from "./edit-actions";
import { CoAuthorInput } from "./CoAuthorInput";
import { Info, FileText, ExternalLink } from "lucide-react";
import { User, Paper, PaperAuthor } from "@prisma/client";
import { useToast } from "@/components/Toast";

interface CoAuthor {
  name: string;
  userId?: string;
}

type PaperEditData = Paper & {
  authors: PaperAuthor[];
};

export default function SubmitPaperForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  
  // Form state for editing
  const [paperData, setPaperData] = useState<PaperEditData | null>(null);

  useEffect(() => {
    if (editId) {
      getPaperForEdit(editId)
        .then((data: PaperEditData) => {
          setPaperData(data);
          // Filter out the uploader from co-authors since they are added automatically
          const coAuthorsOnly = data.authors
            .filter((a: PaperAuthor) => a.userId !== data.uploaderId)
            .map((a: PaperAuthor) => ({ name: a.authorName, userId: a.userId ?? undefined }));
          setCoAuthors(coAuthorsOnly);
          setFetching(false);
        })
        .catch((err: Error) => {
          setError(err.message);
          setFetching(false);
        });
    }
  }, [editId]);

  const addCoAuthor = () => setCoAuthors([...coAuthors, { name: "" }]);
  const removeCoAuthor = (index: number) => setCoAuthors(coAuthors.filter((_: unknown, i: number) => i !== index));
  const updateCoAuthor = (index: number, value: CoAuthor) => {
    const newAuthors = [...coAuthors];
    newAuthors[index] = value;
    setCoAuthors(newAuthors);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editId && !selectedFile) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (selectedFile) {
      formData.set("file", selectedFile);
    }
    if (editId) {
      formData.set("paperId", editId);
    }
    
    formData.set("coAuthors", JSON.stringify(coAuthors.filter((a) => a.name.trim() !== "")));

    try {
      const result = await submitPaper(formData);
      if (result.success) {
        showToast(editId ? "Paper updated successfully." : "Paper submitted successfully for review.", "success");
        router.push("/scholar");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred during submission.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-psrr-gold border-t-transparent" />
          <p className="font-sans text-psrr-slate">Loading submission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-12 lg:px-16">
      <div className="mb-12 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold text-psrr-navy">
          {editId ? "Revise Submission" : "New Submission"}
        </h1>
        <p className="font-sans text-base text-psrr-slate">
          {editId ? "Update your paper details and re-submit for review." : "Fill in all required fields. Your paper will be reviewed before publishing."}
        </p>
      </div>

      <div className="rounded-xl bg-psrr-white p-8 shadow-[0_4px_24px_0_rgba(11,31,58,0.04)] lg:p-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          {/* Reviewer Feedback (Only if it exists and we're in edit mode) */}
          {editId && paperData?.returnFeedback && (
            <div className="flex flex-col gap-3 rounded-lg border-2 border-psrr-gold border-dashed bg-psrr-gold/5 p-6">
              <div className="flex items-center gap-2 text-psrr-gold-accent">
                <Info className="h-5 w-5" />
                <h4 className="font-display text-sm font-bold uppercase tracking-wider">Reviewer Feedback</h4>
              </div>
              <p className="font-sans text-base italic leading-relaxed text-psrr-navy">
                &ldquo;{paperData.returnFeedback}&rdquo;
              </p>
            </div>
          )}

          {/* Section: Paper Metadata */}
          <div className="flex flex-col gap-6">
            <h4 className="font-display text-sm font-bold tracking-wider text-psrr-slate-light uppercase">PAPER METADATA</h4>
            
            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-psrr-navy">Title *</label>
              <input 
                name="title"
                type="text"
                defaultValue={paperData?.title}
                placeholder="Enter the full title of your research paper"
                className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-psrr-navy">Abstract *</label>
              <textarea 
                name="abstract"
                rows={5}
                defaultValue={paperData?.abstract}
                placeholder="Write a concise summary of your research..."
                className="w-full rounded-lg border border-psrr-border bg-transparent p-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-bold text-psrr-navy">University / Institution *</label>
                <input 
                  name="university"
                  type="text"
                  defaultValue={paperData?.university}
                  placeholder="e.g. University of the Philippines"
                  className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy outline-none focus:border-psrr-navy-cta"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-bold text-psrr-navy">Region *</label>
                <select name="region" defaultValue={paperData?.region || ""} required className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy outline-none focus:border-psrr-navy-cta">
                  <option value="">Select region...</option>
                  <option>NCR</option>
                  <option>Region I</option>
                  <option>Region II</option>
                  <option>Region III</option>
                  <option>Region IV-A</option>
                  <option>Region IV-B</option>
                  <option>Region V</option>
                  <option>Region VI</option>
                  <option>Region VII</option>
                  <option>Region VIII</option>
                  <option>Region IX</option>
                  <option>Region X</option>
                  <option>Region XI</option>
                  <option>Region XII</option>
                  <option>CARAGA</option>
                  <option>BARMM</option>
                  <option>CAR</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-sans text-sm font-bold text-psrr-navy">Field of Study *</label>
                <input 
                  name="fieldOfStudy"
                  type="text"
                  defaultValue={paperData?.fieldOfStudy}
                  placeholder="e.g. B.S. Applied Physics"
                  className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy outline-none focus:border-psrr-navy-cta"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-bold text-psrr-navy">Year of Completion *</label>
                <input 
                  name="year"
                  type="number"
                  defaultValue={paperData?.year || new Date().getFullYear()}
                  className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy outline-none focus:border-psrr-navy-cta"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-bold text-psrr-navy">Advisor / Mentor Name *</label>
                <input 
                  name="advisorName"
                  type="text"
                  defaultValue={paperData?.advisorName}
                  placeholder="Name of your research advisor"
                  className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy outline-none focus:border-psrr-navy-cta"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-sans text-sm font-bold text-psrr-navy">Co-Authors (Optional)</label>
                <div className="flex flex-col gap-3">
                  {coAuthors.map((author: CoAuthor, index: number) => (
                    <CoAuthorInput 
                      key={index}
                      value={author}
                      onChange={(val) => updateCoAuthor(index, val)}
                      onRemove={() => removeCoAuthor(index)}
                    />
                  ))}
                  <button 
                    type="button" 
                    onClick={addCoAuthor}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-psrr-navy-cta/30 font-sans text-sm font-semibold text-psrr-navy-cta hover:border-psrr-navy-cta hover:bg-psrr-surface transition-all"
                  >
                    + Add Co-Author
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-sm font-bold text-psrr-navy">Keywords *</label>
              <input 
                name="keywords"
                type="text"
                defaultValue={paperData?.keywords?.join(", ")}
                placeholder="Separate with commas (e.g. machine learning, physics)"
                className="h-12 w-full rounded-lg border border-psrr-border bg-transparent px-4 font-sans text-sm text-psrr-navy placeholder-psrr-slate-light outline-none transition-all focus:border-psrr-navy-cta focus:ring-1 focus:ring-psrr-navy-cta/20"
                required
              />
            </div>
          </div>

          <div className="h-px w-full bg-psrr-border" />

          {/* Section: PDF Upload */}
          <div className="flex flex-col gap-6">
            <h4 className="font-display text-sm font-bold tracking-wider text-psrr-slate-light uppercase">
              {editId ? "REPLACE PDF (OPTIONAL)" : "PDF UPLOAD"}
            </h4>

            {editId && paperData && (
              <div className="flex items-center gap-4 rounded-lg border border-psrr-border bg-psrr-surface p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-psrr-navy/10 text-psrr-navy">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="font-sans text-xs font-bold text-psrr-slate">Current Manuscript</span>
                  <span className="font-sans text-sm font-medium text-psrr-navy truncate max-w-[200px] md:max-w-md">
                    {paperData.filePath.split('/').pop()}
                  </span>
                </div>
                <a 
                  href={`/api/paper/${paperData.id}/download`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-sans text-xs font-bold text-psrr-navy-cta hover:underline"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            <div 
              className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 transition-all ${
                dragActive ? 'border-psrr-gold bg-psrr-gold/5' : 'border-psrr-navy-cta/20 bg-psrr-surface'
              } ${selectedFile ? 'border-emerald-500 bg-emerald-50/10' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
            >
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {selectedFile ? (
                <>
                  <span className="text-4xl text-emerald-500">✓</span>
                  <p className="font-sans text-sm font-bold text-emerald-600">
                    {selectedFile.name}
                  </p>
                  <button 
                    type="button" 
                    onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Remove and choose another
                  </button>
                </>
              ) : (
                <>
                  <span className="text-4xl text-psrr-navy-cta">↑</span>
                  <p className="font-sans text-sm font-bold text-psrr-navy-cta px-4 text-center">
                    {editId ? "Drag and drop a new PDF to replace the existing one, or click to browse" : "Drag and drop your PDF here, or click to browse"}
                  </p>
                  <p className="font-sans text-xs text-psrr-slate">Maximum file size: 50MB (PDF only)</p>
                </>
              )}
            </div>
            {editId && !selectedFile && (
              <p className="text-xs text-psrr-slate italic">Keep empty to retain the currently uploaded manuscript.</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-600 border border-rose-100">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button 
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-psrr-gold font-display text-base font-bold text-psrr-white transition-all hover:bg-psrr-gold-accent active:scale-95 max-w-md disabled:opacity-50"
            >
              {loading ? "Uploading & Submitting..." : (editId ? "Update & Resubmit Paper" : "Submit Paper for Review")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
