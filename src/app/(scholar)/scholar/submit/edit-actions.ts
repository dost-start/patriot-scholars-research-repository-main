"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function getPaperForEdit(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "SCHOLAR") {
    throw new Error("Unauthorized");
  }

  const paper = await db.paper.findUnique({
    where: { id },
    include: { authors: true }
  });

  if (!paper) {
    throw new Error("Paper not found");
  }

  if (paper.uploaderId !== session.user.id) {
    throw new Error("You can only edit your own submissions.");
  }

  // Only allow editing if it's RETURNED or DRAFT
  if (paper.status !== "RETURNED" && paper.status !== "DRAFT") {
    throw new Error("This paper cannot be edited in its current status.");
  }

  return paper;
}
