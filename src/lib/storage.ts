import { mkdir, readFile, rm, writeFile } from "fs/promises"
import { dirname, join, resolve } from "path"
import { getSupabaseAdmin } from "./supabase"

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "papers"

/**
 * Storage driver selection.
 *
 * "supabase" (default) — cloud object storage, used in staging/production.
 * "local"              — filesystem directory, used for offline development
 *                        so the submission/download flows work without
 *                        Supabase credentials.
 */
const DRIVER = process.env.STORAGE_DRIVER === "local" ? "local" : "supabase"
const LOCAL_ROOT = resolve(process.env.LOCAL_STORAGE_DIR || ".local-storage", BUCKET)

function localPath(path: string) {
  const full = resolve(join(LOCAL_ROOT, path))
  if (!full.startsWith(LOCAL_ROOT)) {
    throw new Error("Invalid storage path.")
  }
  return full
}

/**
 * Uploads a file to storage.
 * @param path The path within the bucket (e.g., 'papers/user-id/filename.pdf')
 * @param file The file Buffer or Blob
 * @returns The stored path
 */
export async function uploadPaper(path: string, file: Buffer | Blob) {
  if (DRIVER === "local") {
    const full = localPath(path)
    await mkdir(dirname(full), { recursive: true })
    const buf = Buffer.isBuffer(file)
      ? file
      : Buffer.from(await (file as Blob).arrayBuffer())
    await writeFile(full, buf)
    return path
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload paper: ${error.message}`)
  }

  return data.path
}

/**
 * Deletes a file from storage.
 */
export async function deletePaper(path: string) {
  if (DRIVER === "local") {
    await rm(localPath(path), { force: true })
    return
  }

  const { error } = await getSupabaseAdmin().storage.from(BUCKET).remove([path])
  if (error) {
    throw new Error(`Failed to delete paper: ${error.message}`)
  }
}

/**
 * Generates a signed URL for temporary access to a paper.
 */
export async function getDownloadUrl(path: string, expiresIn = 3600) {
  if (DRIVER === "local") {
    return `/api/storage/preview?path=${encodeURIComponent(path)}`
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Downloads a file from storage and returns it as a Buffer.
 */
export async function downloadPaper(path: string): Promise<Buffer> {
  if (DRIVER === "local") {
    return readFile(localPath(path))
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from(BUCKET)
    .download(path)

  if (error) {
    throw new Error(`Failed to download paper: ${error.message}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
