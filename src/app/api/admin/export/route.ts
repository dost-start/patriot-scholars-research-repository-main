import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const papers = await db.paper.findMany({
    include: {
      uploader: true,
      _count: {
        select: { downloads: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Helper to escape CSV fields. A leading =, +, -, or @ makes a spreadsheet
  // treat the cell as a formula, so those values are prefixed with a quote
  // (CSV injection).
  const escape = (val: string | number | boolean | null | undefined) => {
    let str = String(val ?? "");
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers_row = [
    "ID", "Title", "Year", "University", "Region", "Field of Study", 
    "Advisor", "Keywords", "Status", "Uploader", "Email", "Downloads", "Submitted"
  ].join(",");

  const rows = papers.map(p => {
    return [
      p.id,
      escape(p.title),
      p.year,
      escape(p.university),
      escape(p.region),
      escape(p.fieldOfStudy),
      escape(p.advisorName),
      escape(p.keywords.join(", ")),
      p.status,
      escape(p.uploader.name),
      escape(p.uploader.email),
      p._count.downloads,
      p.createdAt.toISOString()
    ].join(",");
  });

  // REQ-3.2.2-3: exporting the report reads scholar PII, so it is audited.
  await db.auditLog.create({
    data: {
      adminId: session.user.id,
      action: "EXPORT_REPORT_CSV",
      detail: `Exported ${papers.length} paper record(s) including uploader contact details.`,
    },
  });

  const csv = [headers_row, ...rows].join("\n");
  
  // Add UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const content = BOM + csv;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=psrr-report-${new Date().toISOString().split('T')[0]}.csv`,
    },
  });
}
