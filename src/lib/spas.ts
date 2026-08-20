/**
 * SPAS (Scholarship Program Administration System) scholar verification.
 *
 * The SpasRecord table is pre-populated by an admin uploading a CSV of
 * DOST-SEI scholars. Registration uses this table to verify that a
 * registrant is a genuine DOST-SEI scholar before granting Scholar role.
 */
import { db } from "./db"

export type SpasLookupResult =
  | { found: true; fullName: string }
  | { found: false; reason: "spas_id_not_found" | "birthdate_mismatch" }

/**
 * Look up a scholar by their SPAS ID and verify their birthdate.
 *
 * Birthdate comparison is date-only (year-month-day) so time-zone offsets
 * and time-of-day differences do not cause false negatives.
 */
export async function lookupScholar(
  spasId: string,
  birthdate: Date,
): Promise<SpasLookupResult> {
  const record = await db.spasRecord.findUnique({ where: { spasId } })

  if (!record) {
    return { found: false, reason: "spas_id_not_found" }
  }

  const toDateStr = (d: Date) =>
    `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`

  if (toDateStr(record.birthdate) !== toDateStr(birthdate)) {
    return { found: false, reason: "birthdate_mismatch" }
  }

  return { found: true, fullName: record.fullName }
}
