"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { uploadPaper, deletePaper } from "@/lib/storage";

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
  const keywords = keywordsStr ? keywordsStr.split(",").map(k => k.trim()) : [];
  
  const coAuthorsJson = formData.get("coAuthors") as string;
  const coAuthors = coAuthorsJson ? JSON.parse(coAuthorsJson) as { name: string, userId?: string }[] : [];

  const file = formData.get("file") as File;
  let storagePath: string | null = null;

  if (file && file.size > 0) {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File size exceeds 50MB limit.");
    }

    // Upload to Supabase Storage
    const fileExtension = file.name.split(".").pop();
    storagePath = `${session.user.id}/${Date.now()}.${fileExtension}`;
    
    const buffer = Buffer.from(await file.arrayBuffer());
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

      // Overwriting files is only allowed if status is DRAFT or RETURNED
      if (storagePath && existing.status !== "DRAFT" && existing.status !== "RETURNED") {
        throw new Error("You can only replace the PDF file when the submission is in DRAFT or RETURNED status.");
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
