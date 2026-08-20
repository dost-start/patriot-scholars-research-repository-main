import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { downloadPaper } from "@/lib/storage";
import { decryptField } from "@/lib/crypto";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new NextResponse("Unauthorized. Please log in to download papers.", { status: 401 });
  }

  const paper = await db.paper.findUnique({
    where: { id },
  });

  if (!paper) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const isUploader = session?.user?.id === paper.uploaderId;
  const isAdmin = session?.user?.role === "ADMIN";

  if (paper.status !== "PUBLISHED" && !isUploader && !isAdmin) {
    return new NextResponse("Not Found or Not Published", { status: 404 });
  }

  let downloaderName = "Anonymous Guest";
  let downloaderIdLabel = "GUEST";

  if (session?.user) {
    const userRecord = await db.user.findUnique({
      where: { id: session.user.id },
      include: { scholarProfile: true }
    });

    if (userRecord) {
      downloaderName = userRecord.name;
      if (userRecord.scholarProfile?.spasId) {
        downloaderIdLabel = decryptField(userRecord.scholarProfile.spasId);
      } else {
        downloaderIdLabel = userRecord.role;
      }
    }
  }

  try {
    const pdfBuffer = await downloadPaper(paper.filePath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    
    const downloadTime = new Date().toLocaleString("en-PH", { 
      timeZone: "Asia/Manila",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const watermarkOverlay = `COPY OF: ${downloaderName.toUpperCase()} (${downloaderIdLabel})`;
    const footerText = `PSRR RESEARCH REPOSITORY | ID: ${id} | DATE: ${downloadTime} | USER: ${downloaderName} [${downloaderIdLabel}]`;

    for (const page of pages) {
      const { width, height } = page.getSize();
      
      page.drawText(watermarkOverlay, {
        x: 50,
        y: height / 3,
        size: 30,
        font: helveticaFont,
        color: rgb(0.8, 0.2, 0.2),
        opacity: 0.08,
        rotate: degrees(35),
      });

      page.drawText(footerText, {
        x: 30,
        y: 15,
        size: 7,
        font: helveticaFont,
        color: rgb(0.04, 0.12, 0.23),
        opacity: 0.6,
      });
      
      page.drawText("OFFICIAL PSRR COPY", {
        x: width - 140,
        y: height - 30,
        size: 9,
        font: helveticaFont,
        color: rgb(0.83, 0.57, 0.04),
        opacity: 0.5,
      });
    }

    const modifiedPdfBuffer = await pdfDoc.save();

    // REQ-3.1.6-1: Track download for analytics
    try {
      await db.download.create({
        data: {
          paperId: id,
          userId: session.user.id
        }
      });
    } catch (dbError) {
      console.error("Failed to record download in database:", dbError);
      // We don't fail the request if the log fails, to ensure user gets their file
    }

    return new NextResponse(Buffer.from(modifiedPdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${paper.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Watermarking failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
