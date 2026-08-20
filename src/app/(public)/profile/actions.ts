"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;

  await db.$transaction(async (tx) => {
    // Update basic user info
    await tx.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
    });
  });

  revalidatePath("/profile");
  revalidatePath("/admin/users");
  
  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
    throw new Error("Both current and new passwords are required.");
  }

  const result = await auth.api.changePassword({
    headers: await headers(),
    body: {
      newPassword,
      currentPassword,
      revokeOtherSessions: false
    }
  });

  if (!result || 'error' in result) {
    throw new Error("Failed to update password. Please check your current password.");
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function revokeSessionAction(sessionId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await auth.api.revokeSession({
    headers: await headers(),
    body: {
      token: sessionId,
    },
  });

  revalidatePath("/profile");
}
