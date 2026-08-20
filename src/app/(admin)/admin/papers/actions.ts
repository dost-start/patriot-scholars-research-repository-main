"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sendStatusUpdate } from "@/lib/mailer";

export async function reviewPaper(paperId: string, status: "PUBLISHED" | "RETURNED" | "REJECTED", feedback?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // SRS 4.1 Path B: a return or rejection must carry a reason.
  if ((status === "RETURNED" || status === "REJECTED") && !feedback?.trim()) {
    throw new Error("A reason is required when returning or rejecting a submission.");
  }

  const paper = await db.paper.findUnique({
    where: { id: paperId },
    include: { uploader: true },
  });

  if (!paper) {
    throw new Error("Paper not found");
  }

  const actionMap = {
    PUBLISHED: "Approved Paper",
    RETURNED: "Returned Paper for Revision",
    REJECTED: "Permanently Rejected Paper"
  };

  await db.$transaction([
    db.paper.update({
      where: { id: paperId },
      data: { 
        status,
        returnFeedback: (status === "RETURNED" || status === "REJECTED") ? feedback : null
      },
    }),
    db.auditLog.create({
      data: {
        adminId: session.user.id,
        paperId: paperId,
        action: actionMap[status],
        detail: (status === "RETURNED" || status === "REJECTED") ? feedback : undefined
      }
    })
  ]);

  // SRS 4.1: the scholar is notified of the outcome. A mail failure must not
  // roll back a decision that is already recorded.
  try {
    await sendStatusUpdate(paper.uploader.email, paper.title, status, feedback);
  } catch (mailError) {
    console.error("Failed to send status update email:", mailError);
  }

  revalidatePath("/admin/papers");
  revalidatePath("/admin");
  revalidatePath("/scholar");
  revalidatePath("/search");
}
