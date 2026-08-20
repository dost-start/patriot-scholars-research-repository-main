/**
 * AES-256-GCM symmetric encryption for PII fields (spasId, fullName, etc.)
 *
 * Format of encrypted payload (base64-encoded):
 *   [ 12-byte IV ][ 16-byte GCM auth tag ][ ciphertext ]
 *
 * The ENCRYPTION_KEY env var must be 64 hex characters (32 bytes).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // 96-bit IV recommended for GCM
const TAG_LENGTH = 16 // 128-bit auth tag

function parseKey(hexKey: string): Buffer {
  if (hexKey.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${hexKey.length} characters.`,
    )
  }
  return Buffer.from(hexKey, "hex")
}

/**
 * Encrypts `plaintext` with AES-256-GCM.
 * Returns a base64 string: IV + auth tag + ciphertext.
 */
export function encrypt(plaintext: string, hexKey: string): string {
  const key = parseKey(hexKey)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString("base64")
}

/**
 * Decrypts a base64 string produced by `encrypt`.
 * Throws on authentication failure (tampered data or wrong key).
 */
export function decrypt(payload: string, hexKey: string): string {
  const key = parseKey(hexKey)
  const buf = Buffer.from(payload, "base64")

  if (buf.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Encrypted payload is too short to be valid.")
  }

  const iv = buf.subarray(0, IV_LENGTH)
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString("utf8")
}

/**
 * Convenience wrappers that read ENCRYPTION_KEY from the environment.
 */
export function encryptField(plaintext: string): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY env var is not set.")
  return encrypt(plaintext, key)
}

export function decryptField(payload: string): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY env var is not set.")
  return decrypt(payload, key)
}
