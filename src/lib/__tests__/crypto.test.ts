import { describe, it, expect } from "vitest"
import { encrypt, decrypt } from "../crypto"

// 64 hex chars = 32 bytes (AES-256 key)
const TEST_KEY = "a".repeat(64)

describe("encrypt / decrypt", () => {
  it("returns a non-empty string", () => {
    const result = encrypt("hello", TEST_KEY)
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })

  it("round-trips plaintext correctly", () => {
    const plaintext = "test-value-123"
    const ciphertext = encrypt(plaintext, TEST_KEY)
    expect(decrypt(ciphertext, TEST_KEY)).toBe(plaintext)
  })

  it("produces different ciphertexts for the same input (random IV)", () => {
    const a = encrypt("same", TEST_KEY)
    const b = encrypt("same", TEST_KEY)
    expect(a).not.toBe(b)
  })

  it("round-trips unicode and special characters", () => {
    const plaintext = "Ñoño 日本語 <>&\"'"
    expect(decrypt(encrypt(plaintext, TEST_KEY), TEST_KEY)).toBe(plaintext)
  })

  it("round-trips an empty string", () => {
    expect(decrypt(encrypt("", TEST_KEY), TEST_KEY)).toBe("")
  })

  it("throws on tampered ciphertext", () => {
    const ciphertext = encrypt("secret", TEST_KEY)
    // Flip a character near the end (auth tag region)
    const tampered = ciphertext.slice(0, -4) + "XXXX"
    expect(() => decrypt(tampered, TEST_KEY)).toThrow()
  })

  it("throws on wrong key", () => {
    const ciphertext = encrypt("secret", TEST_KEY)
    const wrongKey = "b".repeat(64)
    expect(() => decrypt(ciphertext, wrongKey)).toThrow()
  })

  it("throws when key is wrong length", () => {
    expect(() => encrypt("x", "short")).toThrow()
  })
})
