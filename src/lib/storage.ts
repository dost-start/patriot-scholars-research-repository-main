import { supabaseAdmin } from "./supabase"

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "papers"

/**
 * Uploads a file to Supabase Storage.
 * @param path The path within the bucket (e.g., 'papers/user-id/filename.pdf')
 * @param file The file Buffer or Blob
 * @returns The public URL or path
 */
export async function uploadPaper(path: string, file: Buffer | Blob) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
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
 * Deletes a file from Supabase Storage.
 */
export async function deletePaper(path: string) {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
  if (error) {
    throw new Error(`Failed to delete paper: ${error.message}`)
  }
}

/**
 * Generates a signed URL for temporary access to a paper.
 */
export async function getDownloadUrl(path: string, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Downloads a file from Supabase Storage and returns it as a Buffer.
 */
export async function downloadPaper(path: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(path);

  if (error) {
    throw new Error(`Failed to download paper: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
