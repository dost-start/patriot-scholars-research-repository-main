# PSRR Build Design
**Project:** DOST-SEI Patriot Scholars Research Repository  
**Date:** 2026-04-17  
**Author:** Andrae M. Mapute  
**SRS Version:** 1.3  
**Status:** Approved

---

## 1. Overview

A monolithic Next.js 16 (App Router) web application with role-based access control, a submission workflow, dynamic PDF watermarking, and faceted search. Single deployment unit — portable to DOST on-premise servers.

**User roles:** Scholar (uploader), Public User (reader), Administrator.

---

## 2. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 / React 19 / Tailwind 4 | Existing project setup |
| Auth | Better Auth + Prisma adapter | TypeScript-first, built-in OTL + password reset, clean session model |
| ORM | Prisma | Type-safe, migration support |
| Email | Nodemailer (SMTP) | Free, self-hostable, no external SaaS dependency |
| Storage | Supabase Storage (abstracted) | Free tier to start; swappable via `lib/storage.ts` |
| PDF Watermark | pdf-lib | Pure Node.js, zero system dependencies, works on-premise |
| DB Host | Supabase Postgres (Prisma connection) | Swappable via `DATABASE_URL` |

---

## 3. Architecture

**Approach:** Option A — Monolithic Next.js with Server Actions + Route Handlers.

- Server Actions handle all form mutations (submission, approvals, SPAS upload)
- Route Handlers handle file I/O (PDF upload, watermarked download streaming)
- `lib/` layer abstracts all external services — no page/component imports Prisma, Supabase, or pdf-lib directly

### 3.1 Folder Structure

```
src/
├── app/
│   ├── (public)/               # Landing, search, paper detail, auth pages
│   │   ├── page.tsx            # Landing / hero + search bar
│   │   ├── search/page.tsx     # Search results + faceted filters
│   │   ├── paper/[id]/page.tsx # Paper detail (public: metadata + abstract only)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify/page.tsx     # OTL confirmation + error screens
│   ├── (scholar)/
│   │   ├── dashboard/page.tsx  # Scholar's papers + statuses
│   │   ├── submit/page.tsx     # New submission form
│   │   ├── paper/[id]/edit/page.tsx  # Edit/overwrite (Draft or Returned only)
│   │   └── settings/page.tsx   # Profile view + password change
│   ├── (admin)/
│   │   ├── queue/page.tsx      # Pending review list
│   │   ├── queue/[id]/page.tsx # Per-paper approve/reject detail view
│   │   ├── analytics/page.tsx  # Top downloads, active regions, total output
│   │   ├── audit/page.tsx      # Immutable audit log viewer
│   │   └── spas/page.tsx       # SPAS CSV upload
│   └── api/
│       ├── download/[paperId]/route.ts   # Watermarked PDF stream
│       ├── upload/route.ts               # PDF file upload
│       └── admin/spas-upload/route.ts    # SPAS CSV ingest
├── lib/
│   ├── auth.ts          # Better Auth config + Prisma adapter
│   ├── db.ts            # Prisma client singleton
│   ├── storage.ts       # uploadFile() / getFileUrl() / deleteFile() — Supabase impl
│   ├── mailer.ts        # Nodemailer: sendOTL(), sendPasswordReset(), sendStatusUpdate()
│   ├── watermark.ts     # pdf-lib: stampWatermark(pdfBytes, userName, userId, datetime)
│   ├── spas.ts          # lookupScholar(spasId, fullName, birthdate) → boolean
│   └── crypto.ts        # AES-256 encrypt/decrypt for PII fields
├── components/          # Shared UI components
└── middleware.ts        # Role-based route protection
```

### 3.2 Storage Abstraction

`lib/storage.ts` exports exactly three functions:

```ts
uploadFile(path: string, buffer: Buffer, mimeType: string): Promise<string>
getFileStream(path: string): Promise<ReadableStream>
deleteFile(path: string): Promise<void>
```

Swapping Supabase for S3, R2, or local filesystem requires only changing this file.

---

## 4. Data Layer

### 4.1 Prisma Schema (canonical)

```prisma
enum Role        { SCHOLAR PUBLIC ADMIN }
enum PaperStatus { DRAFT PENDING PUBLISHED RETURNED }

model User {
  id            String          @id @default(cuid())
  email         String          @unique   // AES-256 encrypted
  emailVerified Boolean         @default(false)
  passwordHash  String
  role          Role            @default(PUBLIC)
  isActive      Boolean         @default(false)
  createdAt     DateTime        @default(now())

  scholarProfile ScholarProfile?
  papers         Paper[]         @relation("Uploader")
  downloads      Download[]
  auditLogs      AuditLog[]
  sessions       Session[]
  accounts       Account[]
}

model ScholarProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  spasId    String   @unique   // AES-256 encrypted
  fullName  String             // AES-256 encrypted
  birthdate DateTime
  university String
  region    String
  user      User     @relation(fields: [userId], references: [id])
}

model Paper {
  id           String       @id @default(cuid())
  title        String
  abstract     String
  year         Int
  university   String
  region       String
  fieldOfStudy String
  advisorName  String
  keywords     String[]
  filePath     String
  status       PaperStatus  @default(PENDING)
  uploaderId   String
  returnFeedback String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  uploader     User         @relation("Uploader", fields: [uploaderId], references: [id])
  authors      PaperAuthor[]
  downloads    Download[]
  auditLogs    AuditLog[]
}

model PaperAuthor {
  paperId    String
  authorName String
  userId     String?
  paper      Paper   @relation(fields: [paperId], references: [id])
  @@id([paperId, authorName])
}

model Download {
  id           String   @id @default(cuid())
  paperId      String
  userId       String
  downloadedAt DateTime @default(now())
  paper        Paper    @relation(fields: [paperId], references: [id])
  user         User     @relation(fields: [userId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  adminId   String
  paperId   String?
  action    String   // "APPROVED" | "RETURNED" | "VIEWED_PII" | "SPAS_UPLOAD"
  detail    String?
  createdAt DateTime @default(now())
  admin     User     @relation(fields: [adminId], references: [id])
  paper     Paper?   @relation(fields: [paperId], references: [id])
}

model SpasRecord {
  id        String   @id @default(cuid())
  spasId    String   @unique
  fullName  String
  birthdate DateTime
}

// Better Auth managed models
model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id])
}

model Account {
  id           String  @id
  userId       String
  providerId   String
  accountId    String
  user         User    @relation(fields: [userId], references: [id])
}
```

**PII encryption:** `email`, `spasId`, and `fullName` are encrypted via `lib/crypto.ts` (AES-256-GCM) at the application layer before writing to DB. Prisma stores ciphertext only.

---

## 5. Auth Flows

| Flow | Mechanism |
|---|---|
| Register (Public User) | Email + password → Better Auth creates account → OTL email via Nodemailer → user clicks link → `isActive = true` |
| Register (Scholar) | Same as above + SPAS ID / Full Name / Birthdate checked against `SpasRecord` via `lib/spas.ts` before account creation |
| SPAS lookup fail | Registration blocked; display "Record Not Found — Contact DOST Scholarship Division" screen |
| Login | Better Auth cookie-based session |
| Forgot password | Better Auth reset token → Nodemailer → user sets new password |

**`middleware.ts` rules:**

| Path | Requirement |
|---|---|
| `/scholar/*` | `role === SCHOLAR` and `isActive === true` |
| `/admin/*` | `role === ADMIN` |
| `/api/download/*` | Any authenticated user (`isActive === true`) |
| All others | Public |

Unauthenticated → redirect `/login`. Wrong role → 403 page.

---

## 6. Core Feature Flows

### 6.1 Paper Submission
1. Scholar fills form → Server Action validates all fields
2. PDF uploaded via `POST /api/upload` → `lib/storage.ts` → returns `filePath`
3. Prisma writes `Paper` + `PaperAuthor` rows, status = `PENDING`
4. Nodemailer notifies admin of new pending submission

**Edit/overwrite rule:** Scholar may replace PDF only when `status === DRAFT || status === RETURNED`.

### 6.2 Watermarked PDF Download
1. `GET /api/download/[paperId]` — middleware checks auth
2. Fetch PDF stream from `lib/storage.ts`
3. `lib/watermark.ts` stamps diagonal text: `"Downloaded by [Full Name] (ID: [UserID]) on [YYYY-MM-DD HH:mm] via DOST-SEI Repository"` using pdf-lib
4. Stream watermarked bytes directly to browser (no temp file on disk)
5. Write `Download` row + `AuditLog` row
6. Target: ≤5 seconds for files under 10MB (REQ-3.1.5-5)

### 6.3 Faceted Search
- `GET /api/search?q=&year=&region=&university=&field=&keywords=&sort=&page=`
- Prisma full-text on `title`, `abstract`, `keywords` (Postgres `to_tsvector`)
- `WHERE` filters for year, region, university, field of study, keywords
- Sort: relevance (default), year DESC/ASC, most downloaded
- Public users: `filePath` never returned. Abstract truncated to 300 chars.

### 6.4 Admin Approval Workflow
1. Admin views pending queue → opens submission detail page
2. Clicks **Approve** → `status = PUBLISHED` → paper becomes searchable → Scholar notified via email
3. Clicks **Return** → must fill feedback textbox → `status = RETURNED`, `returnFeedback` saved → Scholar notified
4. All actions written to `AuditLog`

### 6.5 SPAS CSV Upload (Admin)
1. Admin uploads CSV on `/admin/spas` page
2. `POST /api/admin/spas-upload` parses rows (spasId, fullName, birthdate)
3. Prisma `upsert` into `SpasRecord` — existing records updated, new ones inserted
4. Action logged to `AuditLog` with row count

---

## 7. Analytics Dashboard

Data sourced entirely from existing DB tables — no separate analytics store.

| Widget | Source |
|---|---|
| Top 10 Downloaded Papers | `Download` grouped by `paperId`, ordered by count DESC |
| Active Regions | `ScholarProfile.region` grouped by count (uploads, not downloads) |
| Total Research Output | `Paper` where `status = PUBLISHED`, grouped by `fieldOfStudy` |

Admin can export each report as CSV via a Server Action that streams a CSV response.

---

## 8. Updated Ticket Backlog (Additions)

The following tickets are missing from the original backlog and must be added:

**Phase 1:**
- `[Auth]` Registration Status Prompts — "Record Not Found" error screen + "OTL Sent" confirmation screen
- `[Admin]` SPAS Dataset Upload — CSV upload UI + `/api/admin/spas-upload` endpoint

**Phase 2:**
- `[UI]` Account Settings / Profile Page — view verified profile, change password
- `[API]` Email Notifications — Nodemailer wiring for OTL, password reset, publish/return status alerts

**Phase 3:**
- `[UI]` Paper Details Page — public view (metadata + abstract, download locked) + authenticated view (download active)
- `[Admin]` Admin Submission Review Page — per-paper approve/reject detail view with mandatory feedback textbox
- `[Admin]` Admin Audit Log Viewer — immutable table of admin actions involving Scholar PII

**Phase 4:**
- `[QA]` Watermark Performance Test — verify ≤5s for files under 10MB (REQ-3.1.5-5)
- `[Deploy]` HTTPS/TLS 1.3 config — nginx/server configuration

---

## 9. Non-Functional Constraints

- **RWD:** 320px mobile to 1920px+ desktop
- **Concurrent users:** 1,000 (REQ-3.3.1-1)
- **Search response:** <2 seconds (REQ-3.3.1-2)
- **Watermark:** ≤5 seconds for <10MB PDFs (REQ-3.1.5-5)
- **PII encryption:** AES-256-GCM at rest (REQ-3.2.2-2)
- **Audit logs:** Immutable, retained ≥1 year (REQ-3.2.2-3, REQ-3.2.2-4)
- **TLS:** HTTPS/TLS 1.3 in production (REQ-3.3.3-2)
- **DPA 2012:** Consent checkbox on registration; data retention policy enforced
