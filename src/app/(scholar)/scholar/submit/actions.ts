"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { uploadPaper, deletePaper } from "@/lib/storage";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // REQ-3.1.3-3
const MAX_ABSTRACT_WORDS = 500; // REQ-3.1.3-2
const MIN_KEYWORDS = 3; // REQ-3.1.3-2

/**
 * REQ-3.1.3-3: uploads are restricted to PDF. The client `accept=".pdf"` hint
 * is trivially bypassed, so the bytes themselves are checked here — a real PDF
 * always starts with the "%PDF-" header.
 */
function assertIsPdf(file: File, buffer: Buffer) {
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  const hasPdfHeader = buffer.subarray(0, 5).toString("latin1") === "%PDF-";

  if (!hasPdfExtension || !hasPdfHeader) {
    throw new Error("Only PDF files are accepted. Please upload a valid PDF document.");
  }
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function submitPaper(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "SCHOLAR") {
    throw new Error("Only scholars can submit papers.");
  }

  const paperId = formData.get("paperId") as string; // Optional: provided when editing
  const title = formData.get("title") as string;
  const abstract = formData.get("abstract") as string;
  const fieldOfStudy = formData.get("fieldOfStudy") as string;
  const region = formData.get("region") as string;
  const university = formData.get("university") as string;
  const advisorName = formData.get("advisorName") as string;
  const year = parseInt(formData.get("year") as string) || new Date().getFullYear();
  const keywordsStr = formData.get("keywords") as string;
  const keywords = keywordsStr
    ? keywordsStr.split(",").map(k => k.trim()).filter(Boolean)
    : [];
  
  const coAuthorsJson = formData.get("coAuthors") as string;
  const coAuthors = coAuthorsJson ? JSON.parse(coAuthorsJson) as { name: string, userId?: string }[] : [];

  // ---------------------------------------------------------------------------
  // Metadata validation (REQ-3.1.3-2). The form marks these required, but a
  // Server Action is a public endpoint — it has to enforce them itself.
  // ---------------------------------------------------------------------------
  const required: Array<[string, string]> = [
    ["Title", title],
    ["Abstract", abstract],
    ["University / Institution", university],
    ["Region", region],
    ["Field of Study", fieldOfStudy],
    ["Advisor / Mentor Name", advisorName],
  ];
  for (const [label, value] of required) {
    if (!value || !value.trim()) {
      throw new Error(`${label} is required.`);
    }
  }

  if (countWords(abstract) > MAX_ABSTRACT_WORDS) {
    throw new Error(`Abstract must be ${MAX_ABSTRACT_WORDS} words or fewer.`);
  }

  if (keywords.filter(Boolean).length < MIN_KEYWORDS) {
    throw new Error(`Please provide at least ${MIN_KEYWORDS} comma-separated keywords.`);
  }

  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    throw new Error("Year of completion is not a valid year.");
  }

  const file = formData.get("file") as File;
  let storagePath: string | null = null;

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error("File size exceeds 50MB limit.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    assertIsPdf(file, buffer);

    storagePath = `${session.user.id}/${Date.now()}.pdf`;
    await uploadPaper(storagePath, buffer);
  }

  // We'll create or update the paper and the authors in a transaction
  let oldFilePathToCleanup: string | null = null;

  const paper = await db.$transaction(async (tx) => {
    let p;

    if (paperId) {
      // Check ownership and status (REQ-3.1.3-5)
      const existing = await tx.paper.findUnique({ where: { id: paperId } });
      if (!existing || existing.uploaderId !== session.user.id) {
        throw new Error("Unauthorized to edit this paper.");
      }

      // REQ-3.1.3-5: a submission is only editable while it is a draft or has
      // been returned. Published and in-review papers are frozen, so an edit
      // cannot silently pull a published paper back out of the repository.
      if (existing.status !== "DRAFT" && existing.status !== "RETURNED") {
        throw new Error("This paper can only be edited while it is in DRAFT or RETURNED status.");
      }

      // If we have a new storage path, mark the old one for cleanup
      if (storagePath && existing.filePath) {
        oldFilePathToCleanup = existing.filePath;
      }

      p = await tx.paper.update({
        where: { id: paperId },
        data: {
          title,
          abstract,
          fieldOfStudy,
          region,
          keywords,
          ...(storagePath ? { filePath: storagePath } : {}),
          university: university || "N/A",
          advisorName: advisorName || "N/A",
          year,
          status: "PENDING", // Reset to pending for re-review
          returnFeedback: null, // Clear feedback
        }
      });

      // Clear existing authors and re-add (easier than syncing)
      await tx.paperAuthor.deleteMany({ where: { paperId } });
    } else {
      if (!storagePath) {
        throw new Error("PDF file is required for new submissions.");
      }

      p = await tx.paper.create({
        data: {
          title,
          abstract,
          fieldOfStudy,
          region,
          keywords,
          filePath: storagePath,
          university: university || "N/A",
          advisorName: advisorName || "N/A",
          year,
          uploaderId: session.user.id,
          status: "PENDING",
        }
      });
    }

    // Add uploader as the primary author
    await tx.paperAuthor.create({
      data: {
        paperId: p.id,
        authorName: session.user.name || "Unknown Scholar",
        userId: session.user.id
      }
    });

    // Add co-authors
    for (const author of coAuthors) {
      if (author.userId === session.user.id) continue;
      if (author.name.toLowerCase() === session.user.name?.toLowerCase()) continue;
      
      await tx.paperAuthor.create({
        data: {
          paperId: p.id,
          authorName: author.name,
          userId: author.userId
        }
      });
    }

    return p;
  });

  revalidatePath("/admin/papers");
  revalidatePath("/admin");
  revalidatePath("/scholar");
  revalidatePath("/search");

  // Clean up old file if replacement was successful
  if (oldFilePathToCleanup) {
    try {
      await deletePaper(oldFilePathToCleanup);
    } catch (e) {
      console.error("Failed to delete orphaned paper file:", e);
      // We don't throw here to avoid failing the whole request after DB success
    }
  }
  
  return { success: true, id: paper.id };
}

export async function deletePaperAction(paperId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "SCHOLAR") {
    throw new Error("Unauthorized");
  }

  const paper = await db.paper.findUnique({
    where: { id: paperId },
  });

  if (!paper || paper.uploaderId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  // Published papers cannot be deleted by scholars
  if (paper.status === "PUBLISHED") {
    throw new Error("Published papers cannot be deleted by scholars.");
  }

  await db.$transaction(async (tx) => {
    // Handle related records that don't have cascade delete
    await tx.download.deleteMany({ where: { paperId } });
    await tx.auditLog.deleteMany({ where: { paperId } });
    // PaperAuthor has onDelete: Cascade in the DB, but we'll be safe
    await tx.paperAuthor.deleteMany({ where: { paperId } });
    
    await tx.paper.delete({ where: { id: paperId } });
  });

  // Delete from storage
  try {
    await deletePaper(paper.filePath);
  } catch (e) {
    console.error("Failed to delete paper from storage:", e);
  }

  revalidatePath("/scholar");
  revalidatePath("/admin/papers");
  revalidatePath("/admin");
}
