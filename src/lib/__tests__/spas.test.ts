import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the db module so tests never touch a real database
vi.mock("../db", () => ({
  db: {
    spasRecord: {
      findUnique: vi.fn(),
    },
  },
}))

import { db } from "../db"
import { lookupScholar } from "../spas"

const mockFindUnique = db.spasRecord.findUnique as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

const BIRTHDATE = new Date("2000-05-15T00:00:00.000Z")

describe("lookupScholar", () => {
  it("returns found: true with fullName when spasId and birthdate match", async () => {
    mockFindUnique.mockResolvedValue({
      id: "rec1",
      spasId: "SEI-2024-001",
      fullName: "Juan dela Cruz",
      birthdate: BIRTHDATE,
    })

    const result = await lookupScholar("SEI-2024-001", BIRTHDATE)

    expect(result).toEqual({ found: true, fullName: "Juan dela Cruz" })
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { spasId: "SEI-2024-001" },
    })
  })

  it("returns found: false when spasId does not exist", async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await lookupScholar("NONEXISTENT", BIRTHDATE)

    expect(result).toEqual({ found: false, reason: "spas_id_not_found" })
  })

  it("returns found: false when birthdate does not match (same day, different time is still same)", async () => {
    // Stored birthdate is same calendar date but midnight UTC
    mockFindUnique.mockResolvedValue({
      id: "rec2",
      spasId: "SEI-2024-002",
      fullName: "Maria Santos",
      birthdate: new Date("1999-08-20T00:00:00.000Z"),
    })

    // Supplied birthdate: completely different date
    const result = await lookupScholar("SEI-2024-002", new Date("1999-09-21"))

    expect(result).toEqual({ found: false, reason: "birthdate_mismatch" })
  })

  it("matches birthdate regardless of time-of-day (date-only comparison)", async () => {
    const storedBirthdate = new Date("1999-08-20T00:00:00.000Z")
    mockFindUnique.mockResolvedValue({
      id: "rec3",
      spasId: "SEI-2024-003",
      fullName: "Pedro Reyes",
      birthdate: storedBirthdate,
    })

    // Same calendar date but supplied with local noon time
    const suppliedBirthdate = new Date("1999-08-20T12:00:00.000Z")
    const result = await lookupScholar("SEI-2024-003", suppliedBirthdate)

    expect(result).toEqual({ found: true, fullName: "Pedro Reyes" })
  })
})
