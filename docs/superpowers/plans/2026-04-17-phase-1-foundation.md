# Phase 1 — Foundation & Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working, testable authentication system with role-based access, SPAS scholar verification, email OTL verification, and password reset — the foundation all subsequent phases depend on.

**Architecture:** Monolithic Next.js 16 App Router app. All service logic lives in `src/lib/` behind thin abstractions. Better Auth handles sessions and email flows via Prisma adapter. UI uses Server Actions for mutations; no client-side fetch to auth endpoints.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, Better Auth, Prisma, PostgreSQL (Supabase), Nodemailer (SMTP), Vitest, TypeScript strict

**Deliverable:** A user can register as Public or Scholar (with SPAS validation), verify their email, log in, and reset their password. Routes are protected by role via middleware.

---

> **NEXT.JS 16 BREAKING CHANGES** (read before touching any Next.js file):
> - `params` and `searchParams` props on pages/routes are **Promises** — always `await params`
> - `cookies()` and `headers()` from `next/headers` are **async** — always `await cookies()`
> - Route Handler `context.params` is a Promise — `const { id } = await params`

---

## File Map

**Create:**
- `prisma/schema.prisma` — full DB schema
- `src/lib/db.ts` — Prisma singleton
- `src/lib/crypto.ts` — AES-256-GCM encrypt/decrypt for PII
- `src/lib/spas.ts` — SPAS scholar lookup against SpasRecord table
- `src/lib/mailer.ts` — Nodemailer wrapper (sendOTL, sendPasswordReset, sendStatusUpdate)
- `src/lib/auth.ts` — Better Auth config with Prisma adapter
- `src/lib/auth-client.ts` — Better Auth React client
- `src/app/api/auth/[...all]/route.ts` — Better Auth Next.js handler
- `src/middleware.ts` — Role-based route protection
- `src/app/(public)/login/page.tsx` — Login form
- `src/app/(public)/login/actions.ts` — Login Server Action
- `src/app/(public)/register/page.tsx` — Registration form (Public + Scholar flows)
- `src/app/(public)/register/actions.ts` — Registration Server Actions
- `src/app/(public)/verify/page.tsx` — OTL verification + status prompts
- `src/app/(public)/forgot-password/page.tsx` — Password reset request
- `src/app/(public)/forgot-password/actions.ts` — Reset request Server Action
- `src/app/(public)/reset-password/page.tsx` — New password form
- `src/app/(public)/reset-password/actions.ts` — Reset Server Action
- `src/app/(public)/layout.tsx` — Public route group layout
- `src/app/(scholar)/layout.tsx` — Scholar route group layout (auth guard)
- `src/app/(admin)/layout.tsx` — Admin route group layout (auth guard)
- `src/app/403/page.tsx` — Forbidden page
- `src/test/setup.ts` — Vitest global setup
- `vitest.config.ts` — Vitest configuration
- `.env.example` — All required env vars documented

**Modify:**
- `package.json` — add dependencies
- `tsconfig.json` — verify path alias `@/` → `src/`
- `src/app/layout.tsx` — root layout (keep minimal)
- `src/app/page.tsx` — redirect to landing (Phase 2 builds landing)

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install better-auth @prisma/client prisma nodemailer pdf-lib @supabase/supabase-js
```

Expected output: `added N packages`

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/nodemailer
```

Expected output: `added N packages`

- [ ] **Step 3: Verify installs**

```bash
npx prisma --version
```

Expected: prints Prisma CLI version (6.x)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install phase 1 dependencies"
```

---

## Task 2: Environment Variables

**Files:**
- Create: `.env.example`
- Create: `.env.local` (gitignored — fill in actual values)

- [ ] **Step 1: Create `.env.example`**

```bash
cat > .env.example << 'EOF'
# Database (Supabase Postgres — swap DATABASE_URL to migrate off Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# Better Auth
BETTER_AUTH_SECRET="generate-with: openssl rand -hex 32"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# PII Encryption (AES-256 key — 64 hex chars = 32 bytes)
ENCRYPTION_KEY="generate-with: openssl rand -hex 32"

# SMTP (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your@email.com"
SMTP_PASS="your-app-password"
SMTP_FROM="DOST-SEI Repository <noreply@example.com>"

# Supabase Storage (swap lib/storage.ts to migrate off Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="papers"
EOF
```

- [ ] **Step 2: Copy to `.env.local` and fill in real values**

```bash
cp .env.example .env.local
```

Fill in `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `ENCRYPTION_KEY`, and SMTP fields.

Generate secrets:
```bash
openssl rand -hex 32  # run twice — once for BETTER_AUTH_SECRET, once for ENCRYPTION_KEY
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add env vars template"
```

---

## Task 3: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom"
```

- [ ] **Step 3: Add test script to `package.json`**

Open `package.json` and add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Verify Vitest runs**

```bash
npm run test:run
```

Expected: `No test files found`

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json
git commit -m "chore: add vitest test setup"
```

---

## Task 4: Prisma Schema & Migration

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: creates `prisma/schema.prisma` and updates `.env` hint.

- [ ] **Step 2: Replace `prisma/schema.prisma` with full schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  SCHOLAR
  PUBLIC
  ADMIN
}

enum PaperStatus {
  DRAFT
  PENDING
  PUBLISHED
  RETURNED
}

model User {
  id            String          @id @default(cuid())
  email         String          @unique
  emailVerified Boolean         @default(false)
  name          String          @default("")
  image         String?
  role          Role            @default(PUBLIC)
  isActive      Boolean         @default(false)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  scholarProfile ScholarProfile?
  papers         Paper[]         @relation("Uploader")
  downloads      Download[]
  auditLogs      AuditLog[]      @relation("AdminActions")
  sessions       Session[]
  accounts       Account[]
}

model ScholarProfile {
  id         String   @id @default(cuid())
  userId     String   @unique
  spasId     String   @unique
  fullName   String
  birthdate  DateTime
  university String
  region     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Paper {
  id             String      @id @default(cuid())
  title          String
  abstract       String
  year           Int
  university     String
  region         String
  fieldOfStudy   String
  advisorName    String
  keywords       String[]
  filePath       String
  status         PaperStatus @default(PENDING)
  returnFeedback String?
  uploaderId     String
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  uploader  User          @relation("Uploader", fields: [uploaderId], references: [id])
  authors   PaperAuthor[]
  downloads Download[]
  auditLogs AuditLog[]
}

model PaperAuthor {
  paperId    String
  authorName String
  userId     String?
  paper      Paper   @relation(fields: [paperId], references: [id], onDelete: Cascade)

  @@id([paperId, authorName])
}

model Download {
  id           String   @id @default(cuid())
  paperId      String
  userId       String
  downloadedAt DateTime @default(now())

  paper Paper @relation(fields: [paperId], references: [id])
  user  User  @relation(fields: [userId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  adminId   String
  paperId   String?
  action    String
  detail    String?
  createdAt DateTime @default(now())

  admin User  @relation("AdminActions", fields: [adminId], references: [id])
  paper Paper? @relation(fields: [paperId], references: [id])
}

model SpasRecord {
  id        String   @id @default(cuid())
  spasId    String   @unique
  fullName  String
  birthdate DateTime
}

// Better Auth required models
model Session {
  id        String   @id
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime? @default(now())
  updatedAt  DateTime? @updatedAt
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

Expected: `Your database is now in sync with your schema.`

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "db: initialize prisma schema with all phase 1-4 models"
```

---

## Task 5: `lib/crypto.ts` — PII Encryption (TDD)

**Files:**
- Create: `src/lib/crypto.ts`
- Create: `src/lib/__tests__/crypto.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/crypto.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { encrypt, decrypt } from "../crypto"

// Set a fake 32-byte key for tests
process.env.ENCRYPTION_KEY = "a".repeat(64)

describe("crypto", () => {
  it("encrypt returns a non-empty string different from input", () => {
    const result = encrypt("hello@example.com")
    expect(result).toBeTruthy()
    expect(result).not.toBe("hello@example.com")
  })

  it("decrypt reverses encrypt", () => {
    const original = "SPAS-12345"
    const ciphertext = encrypt(original)
    expect(decrypt(ciphertext)).toBe(original)
  })

  it("two encryptions of the same input produce different ciphertexts (IV randomness)", () => {
    const a = encrypt("same")
    const b = encrypt("same")
    expect(a).not.toBe(b)
    expect(decrypt(a)).toBe("same")
    expect(decrypt(b)).toBe("same")
  })

  it("throws on tampered ciphertext", () => {
    const ct = encrypt("test")
    const tampered = ct.slice(0, -4) + "XXXX"
    expect(() => decrypt(tampered)).toThrow()
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- src/lib/__tests__/crypto.test.ts
```

Expected: FAIL — `Cannot find module '../crypto'`

- [ ] **Step 3: Implement `src/lib/crypto.ts`**

```ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) throw new Error("ENCRYPTION_KEY must be 64 hex chars")
  return Buffer.from(hex, "hex")
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64")
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const buf = Buffer.from(ciphertext, "base64")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run -- src/lib/__tests__/crypto.test.ts
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/crypto.ts src/lib/__tests__/crypto.test.ts
git commit -m "feat: add AES-256-GCM PII encryption utility"
```

---

## Task 6: `lib/db.ts` — Prisma Singleton

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Create `src/lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors on this file

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add prisma client singleton"
```

---

## Task 7: `lib/spas.ts` — Scholar Lookup (TDD)

**Files:**
- Create: `src/lib/spas.ts`
- Create: `src/lib/__tests__/spas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/spas.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("../db", () => ({
  prisma: {
    spasRecord: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from "../db"
import { lookupScholar } from "../spas"

const mockFindFirst = vi.mocked(prisma.spasRecord.findFirst)

describe("lookupScholar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns true when a matching SpasRecord exists", async () => {
    mockFindFirst.mockResolvedValueOnce({
      id: "1",
      spasId: "SPAS-001",
      fullName: "Juan Dela Cruz",
      birthdate: new Date("2000-01-15"),
    })

    const result = await lookupScholar(
      "SPAS-001",
      "Juan Dela Cruz",
      new Date("2000-01-15")
    )
    expect(result).toBe(true)
  })

  it("returns false when no matching SpasRecord exists", async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    const result = await lookupScholar(
      "SPAS-999",
      "Unknown Person",
      new Date("1990-01-01")
    )
    expect(result).toBe(false)
  })

  it("queries by spasId, fullName, and date range", async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    await lookupScholar("SPAS-001", "Juan Dela Cruz", new Date("2000-01-15"))

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          spasId: "SPAS-001",
          fullName: "Juan Dela Cruz",
        }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- src/lib/__tests__/spas.test.ts
```

Expected: FAIL — `Cannot find module '../spas'`

- [ ] **Step 3: Implement `src/lib/spas.ts`**

```ts
import { prisma } from "@/lib/db"

export async function lookupScholar(
  spasId: string,
  fullName: string,
  birthdate: Date
): Promise<boolean> {
  // Match by date range (midnight to midnight) to avoid time-of-day issues
  const start = new Date(birthdate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(birthdate)
  end.setHours(23, 59, 59, 999)

  const record = await prisma.spasRecord.findFirst({
    where: {
      spasId,
      fullName,
      birthdate: { gte: start, lte: end },
    },
  })

  return record !== null
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run -- src/lib/__tests__/spas.test.ts
```

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/spas.ts src/lib/__tests__/spas.test.ts
git commit -m "feat: add SPAS scholar lookup module"
```

---

## Task 8: `lib/mailer.ts` — Nodemailer Wrapper (TDD)

**Files:**
- Create: `src/lib/mailer.ts`
- Create: `src/lib/__tests__/mailer.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/mailer.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" })

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: mockSendMail })),
  },
}))

import { sendOTL, sendPasswordReset, sendStatusUpdate } from "../mailer"

describe("mailer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SMTP_HOST = "smtp.test.com"
    process.env.SMTP_PORT = "587"
    process.env.SMTP_SECURE = "false"
    process.env.SMTP_USER = "user@test.com"
    process.env.SMTP_PASS = "pass"
    process.env.SMTP_FROM = "DOST-SEI <noreply@test.com>"
  })

  it("sendOTL calls sendMail with the verification URL", async () => {
    await sendOTL("scholar@test.com", "https://example.com/verify?token=abc")
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "scholar@test.com",
        subject: expect.stringContaining("Verify"),
        html: expect.stringContaining("https://example.com/verify?token=abc"),
      })
    )
  })

  it("sendPasswordReset calls sendMail with the reset URL", async () => {
    await sendPasswordReset("user@test.com", "https://example.com/reset?token=xyz")
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: expect.stringContaining("Password"),
        html: expect.stringContaining("https://example.com/reset?token=xyz"),
      })
    )
  })

  it("sendStatusUpdate calls sendMail with paper title and status", async () => {
    await sendStatusUpdate("scholar@test.com", "My Thesis Title", "PUBLISHED", null)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "scholar@test.com",
        html: expect.stringContaining("My Thesis Title"),
      })
    )
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- src/lib/__tests__/mailer.test.ts
```

Expected: FAIL — `Cannot find module '../mailer'`

- [ ] **Step 3: Implement `src/lib/mailer.ts`**

```ts
import nodemailer from "nodemailer"

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const FROM = () => process.env.SMTP_FROM ?? "DOST-SEI Repository <noreply@example.com>"

export async function sendOTL(to: string, verificationUrl: string): Promise<void> {
  await createTransporter().sendMail({
    from: FROM(),
    to,
    subject: "Verify your DOST-SEI Repository account",
    html: `
      <p>Welcome to the DOST-SEI Patriot Scholars Research Repository.</p>
      <p>Click the link below to verify your email address. This link expires in 24 hours.</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>If you did not register, ignore this email.</p>
    `,
  })
}

export async function sendPasswordReset(to: string, resetUrl: string): Promise<void> {
  await createTransporter().sendMail({
    from: FROM(),
    to,
    subject: "Reset your DOST-SEI Repository password",
    html: `
      <p>You requested a password reset for your DOST-SEI Repository account.</p>
      <p>Click the link below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, ignore this email.</p>
    `,
  })
}

export async function sendStatusUpdate(
  to: string,
  paperTitle: string,
  status: "PUBLISHED" | "RETURNED",
  feedback: string | null
): Promise<void> {
  const subject =
    status === "PUBLISHED"
      ? `Your submission has been published: ${paperTitle}`
      : `Your submission needs revision: ${paperTitle}`

  const body =
    status === "PUBLISHED"
      ? `<p>Your paper <strong>${paperTitle}</strong> has been approved and is now publicly available in the repository.</p>`
      : `<p>Your paper <strong>${paperTitle}</strong> has been returned for revision.</p>
         ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ""}
         <p>Log in to your dashboard to revise and resubmit.</p>`

  await createTransporter().sendMail({
    from: FROM(),
    to,
    subject,
    html: body,
  })
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run -- src/lib/__tests__/mailer.test.ts
```

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/mailer.ts src/lib/__tests__/mailer.test.ts
git commit -m "feat: add nodemailer email wrapper"
```

---

## Task 9: Better Auth Configuration

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`

> **Note:** Better Auth's full API is at https://better-auth.com/docs — check it if anything below doesn't match the installed version. Run `cat node_modules/better-auth/package.json | grep '"version"'` to confirm the version.

- [ ] **Step 1: Check Better Auth version**

```bash
cat node_modules/better-auth/package.json | grep '"version"'
```

Note the version. If it's < 1.0, check the migration guide.

- [ ] **Step 2: Create `src/lib/auth.ts`**

```ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/db"
import { sendOTL, sendPasswordReset } from "@/lib/mailer"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendOTL(user.email, url)
    },
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "PUBLIC",
        input: true,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },
  advanced: {
    generateId: () => {
      const { createId } = require("@paralleldrive/cuid2")
      return createId()
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
```

> **If `auth.$Infer` doesn't exist in your version:** check Better Auth docs for the correct type export pattern.

- [ ] **Step 3: Create `src/lib/auth-client.ts`**

```ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
})

export const { signIn, signOut, signUp, useSession } = authClient
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Fix any type errors before proceeding.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-client.ts
git commit -m "feat: configure better-auth with prisma adapter and email verification"
```

---

## Task 10: Auth Route Handler

**Files:**
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create `src/app/api/auth/[...all]/route.ts`**

```ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

> **If `toNextJsHandler` doesn't exist:** check Better Auth docs for the Next.js App Router handler. It may be `auth.handler` wrapped differently.

- [ ] **Step 2: Start dev server and verify the auth endpoint responds**

```bash
npm run dev
```

In a separate terminal:
```bash
curl http://localhost:3000/api/auth/get-session
```

Expected: `{"session":null}` or similar JSON (not a 404 or 500)

- [ ] **Step 3: Stop dev server, commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add better-auth next.js route handler"
```

---

## Task 11: Middleware — Role-Based Route Protection (TDD)

**Files:**
- Create: `src/middleware.ts`
- Create: `src/test/middleware.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/test/middleware.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

import { auth } from "@/lib/auth"
import { middleware } from "../middleware"

const mockGetSession = vi.mocked(auth.api.getSession)

function makeRequest(pathname: string) {
  return new NextRequest(`http://localhost:3000${pathname}`)
}

describe("middleware", () => {
  it("allows public routes without session", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const res = await middleware(makeRequest("/"))
    expect(res.status).not.toBe(302)
  })

  it("redirects unauthenticated user from /scholar/dashboard to /login", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const res = await middleware(makeRequest("/scholar/dashboard"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("redirects unauthenticated user from /admin/queue to /login", async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const res = await middleware(makeRequest("/admin/queue"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/login")
  })

  it("allows SCHOLAR on /scholar/* routes", async () => {
    mockGetSession.mockResolvedValueOnce({
      session: { id: "s1" },
      user: { id: "u1", role: "SCHOLAR", isActive: true },
    } as any)
    const res = await middleware(makeRequest("/scholar/dashboard"))
    expect(res.status).not.toBe(307)
  })

  it("redirects PUBLIC user from /admin to /403", async () => {
    mockGetSession.mockResolvedValueOnce({
      session: { id: "s1" },
      user: { id: "u1", role: "PUBLIC", isActive: true },
    } as any)
    const res = await middleware(makeRequest("/admin/queue"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/403")
  })

  it("redirects SCHOLAR from /admin to /403", async () => {
    mockGetSession.mockResolvedValueOnce({
      session: { id: "s1" },
      user: { id: "u1", role: "SCHOLAR", isActive: true },
    } as any)
    const res = await middleware(makeRequest("/admin/queue"))
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/403")
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- src/test/middleware.test.ts
```

Expected: FAIL — `Cannot find module '../middleware'`

- [ ] **Step 3: Implement `src/middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const SCHOLAR_PATHS = ["/scholar"]
const ADMIN_PATHS = ["/admin"]
const PROTECTED_API = ["/api/download"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const needsAuth =
    SCHOLAR_PATHS.some((p) => pathname.startsWith(p)) ||
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) ||
    PROTECTED_API.some((p) => pathname.startsWith(p))

  if (!needsAuth) return NextResponse.next()

  const sessionData = await auth.api.getSession({ headers: request.headers })

  if (!sessionData) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { user } = sessionData

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p)) && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/403", request.url))
  }

  if (SCHOLAR_PATHS.some((p) => pathname.startsWith(p)) && user.role !== "SCHOLAR") {
    return NextResponse.redirect(new URL("/403", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/scholar/:path*", "/admin/:path*", "/api/download/:path*"],
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run -- src/test/middleware.test.ts
```

Expected: PASS — 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/test/middleware.test.ts
git commit -m "feat: add role-based route protection middleware"
```

---

## Task 12: Registration Server Actions (TDD)

**Files:**
- Create: `src/app/(public)/register/actions.ts`
- Create: `src/app/(public)/register/__tests__/actions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/app/(public)/register/__tests__/actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/spas", () => ({
  lookupScholar: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
    },
  },
}))

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { update: vi.fn() },
    scholarProfile: { create: vi.fn() },
  },
}))

import { lookupScholar } from "@/lib/spas"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { registerPublicUser, registerScholar } from "../actions"

const mockLookup = vi.mocked(lookupScholar)
const mockSignUp = vi.mocked(auth.api.signUpEmail)
const mockUserUpdate = vi.mocked(prisma.user.update)
const mockProfileCreate = vi.mocked(prisma.scholarProfile.create)

describe("registerPublicUser", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns success when Better Auth sign-up succeeds", async () => {
    mockSignUp.mockResolvedValueOnce({ user: { id: "u1" }, session: null } as any)

    const result = await registerPublicUser({
      email: "user@test.com",
      password: "SecurePass123!",
      name: "Test User",
      agreedToPrivacy: true,
    })

    expect(result.success).toBe(true)
  })

  it("returns error when agreedToPrivacy is false", async () => {
    const result = await registerPublicUser({
      email: "user@test.com",
      password: "SecurePass123!",
      name: "Test User",
      agreedToPrivacy: false,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("privacy")
  })
})

describe("registerScholar", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns spas_not_found when SPAS lookup fails", async () => {
    mockLookup.mockResolvedValueOnce(false)

    const result = await registerScholar({
      email: "scholar@test.com",
      password: "SecurePass123!",
      name: "Juan Dela Cruz",
      spasId: "SPAS-999",
      birthdate: "2000-01-15",
      agreedToPrivacy: true,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("spas_not_found")
  })

  it("creates scholar profile after successful sign-up", async () => {
    mockLookup.mockResolvedValueOnce(true)
    mockSignUp.mockResolvedValueOnce({ user: { id: "u1" }, session: null } as any)
    mockUserUpdate.mockResolvedValueOnce({} as any)
    mockProfileCreate.mockResolvedValueOnce({} as any)

    const result = await registerScholar({
      email: "scholar@test.com",
      password: "SecurePass123!",
      name: "Juan Dela Cruz",
      spasId: "SPAS-001",
      birthdate: "2000-01-15",
      agreedToPrivacy: true,
    })

    expect(result.success).toBe(true)
    expect(mockProfileCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ spasId: "SPAS-001" }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- "src/app/(public)/register/__tests__/actions.test.ts"
```

Expected: FAIL — `Cannot find module '../actions'`

- [ ] **Step 3: Create `src/app/(public)/register/actions.ts`**

```ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { lookupScholar } from "@/lib/spas"
import { encrypt } from "@/lib/crypto"

type ActionResult = { success: true } | { success: false; error: string }

export async function registerPublicUser(data: {
  email: string
  password: string
  name: string
  agreedToPrivacy: boolean
}): Promise<ActionResult> {
  if (!data.agreedToPrivacy) {
    return { success: false, error: "You must agree to the privacy policy to register." }
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: "PUBLIC",
      },
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message ?? "Registration failed." }
  }
}

export async function registerScholar(data: {
  email: string
  password: string
  name: string
  spasId: string
  birthdate: string
  agreedToPrivacy: boolean
}): Promise<ActionResult> {
  if (!data.agreedToPrivacy) {
    return { success: false, error: "You must agree to the privacy policy to register." }
  }

  const isValid = await lookupScholar(
    data.spasId,
    data.name,
    new Date(data.birthdate)
  )

  if (!isValid) {
    return { success: false, error: "spas_not_found" }
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: "SCHOLAR",
      },
    })

    const userId = result.user.id

    await prisma.user.update({
      where: { id: userId },
      data: { role: "SCHOLAR" },
    })

    await prisma.scholarProfile.create({
      data: {
        userId,
        spasId: encrypt(data.spasId),
        fullName: encrypt(data.name),
        birthdate: new Date(data.birthdate),
        university: "",
        region: "",
      },
    })

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message ?? "Registration failed." }
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run -- "src/app/(public)/register/__tests__/actions.test.ts"
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/register/"
git commit -m "feat: add public user and scholar registration server actions"
```

---

## Task 13: Route Group Layouts

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Create: `src/app/(scholar)/layout.tsx`
- Create: `src/app/(admin)/layout.tsx`
- Create: `src/app/403/page.tsx`

- [ ] **Step 1: Create `src/app/(public)/layout.tsx`**

```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Create `src/app/(scholar)/layout.tsx`**

```tsx
export default function ScholarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 3: Create `src/app/(admin)/layout.tsx`**

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 4: Create `src/app/403/page.tsx`**

```tsx
import Link from "next/link"

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
      <p className="text-gray-600">You do not have permission to view this page.</p>
      <Link href="/" className="text-blue-600 underline">
        Go to homepage
      </Link>
    </main>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: add route group layouts and 403 page"
```

---

## Task 14: Login Page

**Files:**
- Create: `src/app/(public)/login/page.tsx`
- Create: `src/app/(public)/login/actions.ts`

- [ ] **Step 1: Create `src/app/(public)/login/actions.ts`**

```ts
"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

type ActionResult = { success: true } | { success: false; error: string }

export async function loginUser(data: {
  email: string
  password: string
}): Promise<ActionResult> {
  try {
    await auth.api.signInEmail({
      body: { email: data.email, password: data.password },
      headers: await headers(),
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: "Invalid email or password." }
  }
}
```

- [ ] **Step 2: Create `src/app/(public)/login/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { loginUser } from "./actions"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const result = await loginUser({
      email: form.get("email") as string,
      password: form.get("password") as string,
    })

    setLoading(false)

    if (result.success) {
      router.push(callbackUrl)
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">
            DOST-SEI Patriot Scholars Research Repository
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="space-y-2 text-center text-sm text-gray-500">
          <p>
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/login/"
git commit -m "feat: add login page and server action"
```

---

## Task 15: Registration Page (Public + Scholar flows)

**Files:**
- Create: `src/app/(public)/register/page.tsx`

- [ ] **Step 1: Create `src/app/(public)/register/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { registerPublicUser, registerScholar } from "./actions"

type Role = "PUBLIC" | "SCHOLAR"

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>("PUBLIC")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const base = {
      email: form.get("email") as string,
      password: form.get("password") as string,
      name: form.get("name") as string,
      agreedToPrivacy: form.get("agreedToPrivacy") === "on",
    }

    const result =
      role === "SCHOLAR"
        ? await registerScholar({
            ...base,
            spasId: form.get("spasId") as string,
            birthdate: form.get("birthdate") as string,
          })
        : await registerPublicUser(base)

    setLoading(false)

    if (result.success) {
      router.push("/verify?status=sent")
    } else if (result.error === "spas_not_found") {
      router.push("/verify?status=spas_not_found")
    } else {
      setError(result.error)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create an account</h1>
          <p className="mt-1 text-sm text-gray-500">
            DOST-SEI Patriot Scholars Research Repository
          </p>
        </div>

        {/* Role selector */}
        <div className="flex rounded-lg border border-gray-200 p-1">
          {(["PUBLIC", "SCHOLAR"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                role === r
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {r === "PUBLIC" ? "Public User" : "DOST-SEI Scholar"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Minimum 12 characters, must include letters, numbers, and special characters.
            </p>
          </div>

          {/* Scholar-only fields */}
          {role === "SCHOLAR" && (
            <>
              <div>
                <label htmlFor="spasId" className="block text-sm font-medium text-gray-700">
                  DOST-SEI Scholar ID (SPAS ID)
                </label>
                <input
                  id="spasId"
                  name="spasId"
                  type="text"
                  required={role === "SCHOLAR"}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  required={role === "SCHOLAR"}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Data Privacy Consent */}
          <div className="flex items-start gap-3">
            <input
              id="agreedToPrivacy"
              name="agreedToPrivacy"
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="agreedToPrivacy" className="text-sm text-gray-600">
              I have read and agree to the{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Data Privacy Policy
              </Link>{" "}
              in accordance with the Data Privacy Act of 2012 (RA 10173).
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/register/page.tsx"
git commit -m "feat: add registration page with public and scholar flows"
```

---

## Task 16: Registration Status Prompts & Email Verification Page

**Files:**
- Create: `src/app/(public)/verify/page.tsx`

- [ ] **Step 1: Create `src/app/(public)/verify/page.tsx`**

```tsx
import Link from "next/link"

type StatusPageProps = {
  searchParams: Promise<{ status?: string; token?: string; error?: string }>
}

export default async function VerifyPage({ searchParams }: StatusPageProps) {
  const { status, error } = await searchParams

  if (status === "spas_not_found") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl">✕</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Record Not Found</h1>
          <p className="text-gray-600">
            Your Scholar ID, name, or date of birth could not be verified against the DOST-SEI
            records. Please contact the DOST-SEI Scholarship Division to update your records before
            registering.
          </p>
          <p className="text-sm text-gray-500">
            Email:{" "}
            <a href="mailto:sei@sei.dost.gov.ph" className="text-blue-600 hover:underline">
              sei@sei.dost.gov.ph
            </a>
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Try again
          </Link>
        </div>
      </main>
    )
  }

  if (status === "sent") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <span className="text-xl">✉</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
          <p className="text-gray-600">
            We sent a verification link to your email address. Click the link to activate your
            account. The link expires in 24 hours.
          </p>
          <p className="text-sm text-gray-500">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              register again
            </Link>
            .
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-gray-900">Verification failed</h1>
          <p className="text-gray-600">
            The verification link is invalid or has expired. Please register again to receive a new
            link.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Register
          </Link>
        </div>
      </main>
    )
  }

  // Default: verification success (Better Auth redirects here after OTL click)
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <span className="text-xl">✓</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Email verified!</h1>
        <p className="text-gray-600">Your account is now active. You can sign in.</p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/verify/"
git commit -m "feat: add email verification and registration status prompt pages"
```

---

## Task 17: Forgot Password & Reset Password Pages

**Files:**
- Create: `src/app/(public)/forgot-password/page.tsx`
- Create: `src/app/(public)/forgot-password/actions.ts`
- Create: `src/app/(public)/reset-password/page.tsx`
- Create: `src/app/(public)/reset-password/actions.ts`

- [ ] **Step 1: Create `src/app/(public)/forgot-password/actions.ts`**

```ts
"use server"

import { auth } from "@/lib/auth"

type ActionResult = { success: true } | { success: false; error: string }

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  try {
    await auth.api.forgetPassword({
      body: { email, redirectTo: "/reset-password" },
    })
    return { success: true }
  } catch {
    // Always return success to avoid email enumeration
    return { success: true }
  }
}
```

- [ ] **Step 2: Create `src/app/(public)/forgot-password/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "./actions"

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    await requestPasswordReset(form.get("email") as string)
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
          <p className="text-gray-600">
            If that email is registered, you&apos;ll receive a password reset link shortly.
          </p>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create `src/app/(public)/reset-password/actions.ts`**

```ts
"use server"

import { auth } from "@/lib/auth"

type ActionResult = { success: true } | { success: false; error: string }

export async function resetPassword(data: {
  token: string
  newPassword: string
}): Promise<ActionResult> {
  try {
    await auth.api.resetPassword({
      body: { token: data.token, newPassword: data.newPassword },
    })
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message ?? "Reset failed. The link may have expired." }
  }
}
```

- [ ] **Step 4: Create `src/app/(public)/reset-password/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPassword } from "./actions"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Invalid link</h1>
          <p className="text-gray-600">This reset link is missing a token.</p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
            Request a new link
          </Link>
        </div>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const newPassword = form.get("password") as string
    const confirm = form.get("confirm") as string

    if (newPassword !== confirm) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    const result = await resetPassword({ token, newPassword })
    setLoading(false)

    if (result.success) {
      router.push("/login?reset=success")
    } else {
      setError(result.error)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Set new password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">Minimum 12 characters.</p>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/forgot-password/" "src/app/(public)/reset-password/"
git commit -m "feat: add forgot password and reset password pages"
```

---

## Task 18: Full Test Suite Run & TypeScript Check

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```

Expected: All tests pass. Fix any failures before proceeding.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. Fix any type errors.

- [ ] **Step 3: Run dev server and manually verify the auth flows**

```bash
npm run dev
```

Test each flow:
1. `http://localhost:3000/register` — register as Public User, check email OTL arrives
2. `http://localhost:3000/register` — register as Scholar with invalid SPAS ID → should redirect to `/verify?status=spas_not_found`
3. `http://localhost:3000/login` — sign in with verified account
4. `http://localhost:3000/scholar/dashboard` — unauthenticated → redirected to `/login`
5. `http://localhost:3000/admin/queue` — logged in as PUBLIC → redirected to `/403`
6. `http://localhost:3000/forgot-password` — submit email, check reset email arrives

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "feat: complete phase 1 — foundation and identity"
```

---

## Self-Review Checklist

| SRS Requirement | Covered by Task |
|---|---|
| REQ-3.1.1-1 Scholar + Public registration | Task 12, 15 |
| REQ-3.1.1-2 Strong password (min 12 chars) | Task 12 (minLength), Task 15 (minLength attr) |
| REQ-3.1.1-3 Email OTL verification | Task 9 (Better Auth emailVerification), Task 16 |
| REQ-3.1.1-4 Forgot password | Task 17 |
| REQ-3.1.2-1/2/3 Scholar SPAS verification | Task 7, 12 |
| REQ-3.2.2-1 DPA consent checkbox | Task 15 |
| REQ-3.2.2-2 AES-256 PII encryption | Task 5, 12 (encrypt spasId + fullName) |
| REQ-3.3.3-1 SQL injection / XSS prevention | Prisma parameterizes all queries; no raw SQL |
| Registration status prompts (gap ticket) | Task 16 |
| Route protection by role | Task 11 |
