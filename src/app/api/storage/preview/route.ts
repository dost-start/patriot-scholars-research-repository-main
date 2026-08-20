import { auth } from "@/lib/auth"
import { downloadPaper } from "@/lib/storage"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

/**
 * Local-development preview endpoint.
 *
 * The Supabase driver serves inline PDF previews through signed URLs.
 * The filesystem driver (STORAGE_DRIVER=local) has no URL signing, so this
 * route streams the stored file instead. It is disabled unless the local
 * driver is active, and always requires an authenticated session.
 */
export async function GET(req: NextRequest) {
  if (process.env.STORAGE_DRIVER !== "local") {
    return new NextResponse("Not Found", { status: 404 })
  }

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const path = req.nextUrl.searchParams.get("path")
  if (!path) {
    return new NextResponse("Missing path", { status: 400 })
  }

  try {
    const buf = await downloadPaper(path)
    return new NextResponse(Buffer.from(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch {
    return new NextResponse("Not Found", { status: 404 })
  }
}
