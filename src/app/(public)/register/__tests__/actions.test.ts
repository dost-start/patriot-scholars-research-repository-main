import { describe, it, expect, vi, beforeEach } from "vitest"

// ---- Hoist mocks (vi.mock factories run before imports) -------------------
const { mockSignUpEmail, mockLookupScholar, mockUserUpdate, mockScholarProfileCreate } =
  vi.hoisted(() => {
    const mockSignUpEmail = vi.fn()
    const mockLookupScholar = vi.fn()
    const mockUserUpdate = vi.fn()
    const mockScholarProfileCreate = vi.fn()
    return { mockSignUpEmail, mockLookupScholar, mockUserUpdate, mockScholarProfileCreate }
  })

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail: mockSignUpEmail,
    },
  },
}))

vi.mock("@/lib/spas", () => ({
  lookupScholar: mockLookupScholar,
}))

vi.mock("@/lib/db", () => ({
  db: {
    user: { update: mockUserUpdate },
    scholarProfile: { create: mockScholarProfileCreate },
  },
}))

// ---------------------------------------------------------------------------

import {
  registerPublicUser,
  registerScholarUser,
} from "../actions"

const PUBLIC_INPUT = {
  name: "Juan dela Cruz",
  email: "juan@example.com",
  password: "securePassword1!",
}

const SCHOLAR_INPUT = {
  name: "Maria Santos",
  email: "maria@example.com",
  password: "securePassword1!",
  spasId: "SEI-2024-001",
  birthdate: new Date("2000-05-15"),
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Public registration
// ---------------------------------------------------------------------------
describe("registerPublicUser", () => {
  it("calls Better Auth signUpEmail and returns success", async () => {
    mockSignUpEmail.mockResolvedValue({ user: { id: "u1" } })

    const result = await registerPublicUser(PUBLIC_INPUT)

    expect(result).toEqual({ success: true })
    expect(mockSignUpEmail).toHaveBeenCalledOnce()
    const call = mockSignUpEmail.mock.calls[0][0]
    expect(call.body.email).toBe("juan@example.com")
    expect(call.body.name).toBe("Juan dela Cruz")
    expect(call.body.password).toBe("securePassword1!")
  })

  it("returns error when Better Auth throws", async () => {
    mockSignUpEmail.mockRejectedValue(new Error("Email already taken"))

    const result = await registerPublicUser(PUBLIC_INPUT)

    expect(result.success).toBe(false)
    expect((result as { success: false; error: string }).error).toBeTruthy()
  })

  it("validates that email is required", async () => {
    const result = await registerPublicUser({ ...PUBLIC_INPUT, email: "" })

    expect(result.success).toBe(false)
    expect((result as { success: false; field?: string }).field).toBe("email")
  })

  it("validates minimum password length", async () => {
    const result = await registerPublicUser({ ...PUBLIC_INPUT, password: "short" })

    expect(result.success).toBe(false)
    expect((result as { success: false; field?: string }).field).toBe("password")
  })
})

// ---------------------------------------------------------------------------
// Scholar registration
// ---------------------------------------------------------------------------
describe("registerScholarUser", () => {
  it("registers a scholar when SPAS lookup succeeds", async () => {
    mockLookupScholar.mockResolvedValue({ found: true, fullName: "Maria Santos" })
    mockSignUpEmail.mockResolvedValue({ user: { id: "u2" } })
    mockUserUpdate.mockResolvedValue({})
    mockScholarProfileCreate.mockResolvedValue({})

    const result = await registerScholarUser(SCHOLAR_INPUT)

    expect(result).toEqual({ success: true })

    // SPAS lookup called with spasId and birthdate
    expect(mockLookupScholar).toHaveBeenCalledWith(
      SCHOLAR_INPUT.spasId,
      SCHOLAR_INPUT.birthdate,
    )

    // User role upgraded to SCHOLAR
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u2" },
        data: expect.objectContaining({ role: "SCHOLAR" }),
      }),
    )

    // ScholarProfile created
    expect(mockScholarProfileCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          spasId: expect.any(String),
          fullName: expect.any(String),
          userId: "u2",
        }),
      }),
    )
  })

  it("returns error when SPAS ID is not found", async () => {
    mockLookupScholar.mockResolvedValue({ found: false, reason: "spas_id_not_found" })

    const result = await registerScholarUser(SCHOLAR_INPUT)

    expect(result.success).toBe(false)
    expect(mockSignUpEmail).not.toHaveBeenCalled()
  })

  it("returns error when birthdate does not match", async () => {
    mockLookupScholar.mockResolvedValue({ found: false, reason: "birthdate_mismatch" })

    const result = await registerScholarUser(SCHOLAR_INPUT)

    expect(result.success).toBe(false)
    expect(mockSignUpEmail).not.toHaveBeenCalled()
  })

  it("returns error when spasId is missing", async () => {
    const result = await registerScholarUser({ ...SCHOLAR_INPUT, spasId: "" })

    expect(result.success).toBe(false)
    expect((result as { success: false; field?: string }).field).toBe("spasId")
    expect(mockLookupScholar).not.toHaveBeenCalled()
  })
})
