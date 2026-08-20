"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { sendCorrectionRequest } from "@/lib/mailer";

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { isActive: !currentStatus },
    }),
    db.auditLog.create({
      data: {
        adminId: session.user.id,
        action: currentStatus ? "DEACTIVATED_USER" : "ACTIVATED_USER",
        detail: `User: ${user.email}`,
      }
    })
  ]);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function requestCorrection(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Send the email
  await sendCorrectionRequest(user.email, user.name || "Scholar");

  // Create audit log
  await db.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "REQUESTED_CORRECTION",
      detail: `Requested profile correction from user: ${user.email}`,
    },
  });

  revalidatePath(`/admin/users/${userId}`);
}
