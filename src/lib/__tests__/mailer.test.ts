import { describe, it, expect, vi, beforeEach } from "vitest"

// vi.mock factories are hoisted to top of file, so mocks must be declared
// with vi.hoisted() to be accessible inside the factory.
const { mockSendMail, mockCreateTransport } = vi.hoisted(() => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" })
  const mockCreateTransport = vi.fn().mockReturnValue({ sendMail: mockSendMail })
  return { mockSendMail, mockCreateTransport }
})

vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
  createTransport: mockCreateTransport,
}))

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendStatusUpdate,
} from "../mailer"

beforeEach(() => {
  vi.clearAllMocks()
  // Provide required env vars
  process.env.SMTP_HOST = "smtp.example.com"
  process.env.SMTP_PORT = "587"
  process.env.SMTP_SECURE = "false"
  process.env.SMTP_USER = "user@example.com"
  process.env.SMTP_PASS = "secret"
  process.env.SMTP_FROM = "DOST-SEI Repo <noreply@example.com>"
})

describe("sendVerificationEmail", () => {
  it("calls sendMail with correct recipient and subject", async () => {
    await sendVerificationEmail("scholar@test.com", "https://example.com/verify?token=abc")

    expect(mockSendMail).toHaveBeenCalledOnce()
    const args = mockSendMail.mock.calls[0][0]
    expect(args.to).toBe("scholar@test.com")
    expect(args.subject).toMatch(/verif/i)
    expect(args.html).toContain("https://example.com/verify?token=abc")
  })
})

describe("sendPasswordResetEmail", () => {
  it("calls sendMail with reset URL in the body", async () => {
    await sendPasswordResetEmail("user@test.com", "https://example.com/reset?token=xyz")

    expect(mockSendMail).toHaveBeenCalledOnce()
    const args = mockSendMail.mock.calls[0][0]
    expect(args.to).toBe("user@test.com")
    expect(args.subject).toMatch(/password/i)
    expect(args.html).toContain("https://example.com/reset?token=xyz")
  })
})

describe("sendStatusUpdate", () => {
  it("sends PUBLISHED notification", async () => {
    await sendStatusUpdate("author@test.com", "The Paper Title", "PUBLISHED")

    const args = mockSendMail.mock.calls[0][0]
    expect(args.to).toBe("author@test.com")
    expect(args.html).toMatch(/published/i)
  })

  it("sends RETURNED notification with feedback", async () => {
    await sendStatusUpdate(
      "author@test.com",
      "The Paper Title",
      "RETURNED",
      "Please fix the abstract formatting.",
    )

    const args = mockSendMail.mock.calls[0][0]
    expect(args.html).toMatch(/returned/i)
    expect(args.html).toContain("Please fix the abstract formatting.")
  })
})
