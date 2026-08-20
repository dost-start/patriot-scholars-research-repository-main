"use server"

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Server actions for managing SPAS (Scholar Lookup) records.
 */

async function ensureAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Manual upsert of a single SPAS record.
 */
export async function upsertSpasRecord(input: {
  id?: string;
  spasId: string;
  fullName: string;
  birthdate: Date;
}) {
  const session = await ensureAdmin();

  const data = {
    spasId: input.spasId.trim(),
    fullName: input.fullName.trim(),
    birthdate: input.birthdate,
  };

  if (input.id) {
    await db.spasRecord.update({
      where: { id: input.id },
      data,
    });
  } else {
    // Check if spasId already exists
    const existing = await db.spasRecord.findUnique({
      where: { spasId: data.spasId },
    });
    if (existing) {
      throw new Error(`A record with SPAS ID ${data.spasId} already exists.`);
    }

    await db.spasRecord.create({ data });
  }

  await db.auditLog.create({
    data: {
      adminId: session.user.id,
      action: input.id ? "UPDATED_SPAS_RECORD" : "CREATED_SPAS_RECORD",
      detail: `SPAS ID: ${data.spasId}`,
    },
  });

  revalidatePath("/admin/spas");
}

/**
 * Delete a SPAS record.
 */
export async function deleteSpasRecord(id: string) {
  const session = await ensureAdmin();

  const record = await db.spasRecord.findUnique({ where: { id } });
  if (!record) throw new Error("Record not found");

  await db.spasRecord.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "DELETED_SPAS_RECORD",
      detail: `SPAS ID: ${record.spasId}`,
    },
  });

  revalidatePath("/admin/spas");
}

/**
 * Bulk import SPAS records from a CSV file.
 * Expects CSV format: spasId,fullName,birthdate (YYYY-MM-DD)
 */
export async function importSpasCsv(formData: FormData) {
  const session = await ensureAdmin();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

  // Improved CSV parsing to handle quoted values with commas
  const records = lines.slice(1).map(line => {
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 3) return null;

    const [spasId, fullName, birthdateStr] = matches.map(s => 
      s.replace(/^"|"$/g, '').trim()
    );
    
    if (!spasId || !fullName || !birthdateStr) return null;

    const birthdate = new Date(birthdateStr);
    if (isNaN(birthdate.getTime())) return null;

    return {
      spasId,
      fullName,
      birthdate,
    };
  }).filter((r): r is { spasId: string; fullName: string; birthdate: Date } => r !== null);

  if (records.length === 0) {
    throw new Error("No valid records found in CSV.");
  }

  // Bulk upsert logic
  // Since Prisma doesn't have a built-in bulk upsert that handles individual conflicts easily for small batches,
  // we'll loop or use createMany with skipDuplicates if the DB supports it.
  // PostgreSQL supports it.
  
  try {
    const result = await db.spasRecord.createMany({
      data: records,
      skipDuplicates: true,
    });

    await db.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "IMPORTED_SPAS_CSV",
        detail: `Imported ${result.count} records from ${file.name}`,
      },
    });

    revalidatePath("/admin/spas");
    return { success: true, count: result.count };
  } catch (err) {
    console.error("[importSpasCsv] error:", err);
    throw new Error("Failed to import records.");
  }
}
