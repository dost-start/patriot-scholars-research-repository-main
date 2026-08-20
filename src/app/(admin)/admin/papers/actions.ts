"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function reviewPaper(paperId: string, status: "PUBLISHED" | "RETURNED" | "REJECTED", feedback?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
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

  revalidatePath("/admin/papers");
  revalidatePath("/admin");
  revalidatePath("/scholar");
}
