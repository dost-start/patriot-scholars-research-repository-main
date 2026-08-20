# Site Audit: Patriot Scholars Research Repository
**Date:** 2026-04-27  
**Auditor:** Claude (automated code review)  
**Purpose:** Comprehensive inventory of existing screens and functionality, followed by a prioritized list of gaps and improvements for handoff to any developer or LLM.

---

## 1. App Overview

**What it is:** A web platform for DOST-SEI (Department of Science and Technology – Science Education Institute) Patriot Scholars. Scholars submit research papers; admins review and publish them; the public can browse and download published work.

**Tech stack:**
- Next.js (App Router, React Server Components)
- TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL (via Supabase)
- Better Auth (email/password)
- Supabase Storage (PDF files)
- pdf-lib (PDF watermarking on download)
- Nodemailer (transactional email)

**Three user roles:**
| Role | Access |
|------|--------|
| PUBLIC | Browse and download published papers, register |
| SCHOLAR | Everything PUBLIC can do + submit and manage own papers |
| ADMIN | Everything + review queue, user management, audit logs |

**Paper lifecycle:** `DRAFT → PENDING → PUBLISHED` or `RETURNED` (scholar can revise and resubmit)

---

## 2. Existing Screens Inventory

### Public / Unauthenticated

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/` | `src/app/page.tsx` | ✅ Done | Home: hero, stats, featured research, latest submissions |
| `/search` | `src/app/(public)/search/page.tsx` | ✅ Done | Search with keyword, field, year-range filters, pagination |
| `/paper/[id]` | `src/app/(public)/paper/[id]/page.tsx` | ✅ Done | Paper detail: abstract, keywords, metadata, citation block, download button |
| `/login` | `src/app/(public)/login/` | ✅ Done | Email + password login form |
| `/register` | `src/app/(public)/register/` | ✅ Done | Registration form (name, email, password + scholar-specific SPAS fields) |
| `/forgot-password` | `src/app/(public)/forgot-password/` | ✅ Done | Request password-reset email |
| `/reset-password` | `src/app/(public)/reset-password/` | ✅ Done | Set new password via token link |
| `/verify` | `src/app/(public)/verify/page.tsx` | ✅ Done | Email verification landing page |
| `/profile` | `src/app/(public)/profile/` | ✅ Done | View/edit own profile; shows active sessions |
| `/403` | `src/app/403/page.tsx` | ✅ Done | Access-denied error page |

### Scholar (requires SCHOLAR role + isActive)

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/scholar` | `src/app/(scholar)/scholar/page.tsx` | ✅ Done | Dashboard: 4 stat cards + paper list (same data as /scholar/submissions) |
| `/scholar/submissions` | `src/app/(scholar)/scholar/submissions/page.tsx` | ⚠️ Redundant | Near-identical to /scholar — same paper list without the stat cards |
| `/scholar/submit` | `src/app/(scholar)/scholar/submit/` | ✅ Done | Submit new paper (title, abstract, year, field, file upload, co-authors); also handles `?edit=<id>` for revisions |

### Admin (requires ADMIN role)

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/admin` | `src/app/(admin)/admin/page.tsx` | ⚠️ Partial | Analytics overview: 4 stat cards, recent submissions, system activity. Export Report button is non-functional. |
| `/admin/papers` | `src/app/(admin)/admin/papers/page.tsx` | ⚠️ Partial | Review queue table with search + status filter. Pagination UI exists but is permanently disabled. `field` and `region` filters exist in the server query but are NOT exposed in the client filter component. |
| `/admin/papers/[id]` | `src/app/(admin)/admin/papers/[id]/page.tsx` | ✅ Done | Paper review: full metadata, abstract, file details, Publish / Return (with feedback) / Reject actions |
| `/admin/users` | `src/app/(admin)/admin/users/page.tsx` | ✅ Done | User table: name, email, role, active status, link to verification page |
| `/admin/users/[id]` | `src/app/(admin)/admin/users/[id]/page.tsx` | ⚠️ Partial | Scholar verification: compares submitted SPAS data with DB record, activate/deactivate buttons. "Request Correction" button has no handler. |

---

## 3. Bugs and Broken Functionality

These things exist in the UI but do not work.

### BUG-01: Pagination on Admin Papers Table is Non-Functional
- **File:** `src/app/(admin)/admin/papers/page.tsx` lines 163–164
- **What's wrong:** Both Prev and Next buttons are hardcoded as `disabled`. The page fetches all matching papers with no `take`/`skip` applied.
- **Fix needed:** Add `page` to searchParams, apply `take: PAGE_SIZE, skip: page * PAGE_SIZE` in the Prisma query, wire the buttons to increment/decrement the page param.

### BUG-02: Export Report Button Has No Handler
- **File:** `src/app/(admin)/admin/page.tsx` line 54
- **What's wrong:** A `<button>` element with "Export Report" label. No `onClick`, no server action, no API route behind it.
- **Fix needed:** Decide output format (CSV or PDF), create a server action or API route that queries papers/stats, and wire the button to trigger a download.

### BUG-03: "Request Correction" Button Has No Handler
- **File:** `src/app/(admin)/admin/users/[id]/page.tsx` line 148
- **What's wrong:** A `<button>` with label "Request Correction". No `onClick`, no form, no server action.
- **Fix needed:** Define what "Request Correction" means (email to scholar? In-app message?), then implement. Likely: send an email to the scholar asking them to update their SPAS info, and log the action in AuditLog.

### BUG-04: Field and Region Filters Not Exposed in Admin Papers UI
- **File:** `src/app/(admin)/admin/papers/page.tsx` + `src/app/(admin)/admin/papers/PaperFilters.tsx`
- **What's wrong:** The server reads `params.field` and `params.region` from searchParams and filters correctly — but `PaperFilters` only accepts `initialQuery` and `initialStatus` props. There's no UI to set field or region.
- **Fix needed:** Add `field` and `region` dropdowns to `PaperFilters` and pass their initial values from the server page.

### BUG-05: Scholar Dashboard and Submissions Page Are Duplicates
- **Files:** `src/app/(scholar)/scholar/page.tsx` and `src/app/(scholar)/scholar/submissions/page.tsx`
- **What's wrong:** Both pages make the same DB query (`paper.findMany` for the current user) and render the same paper card list. The only difference is the dashboard has 4 stat cards on top. This creates confusion and duplicated code.
- **Fix needed:** Either (a) make `/scholar/submissions` link to `/scholar` (which already has the full list), or (b) give `/scholar` a distinct purpose (overview/stats only) and make `/scholar/submissions` the detailed list. Recommended: keep the dashboard as a summary with a "View All Submissions" link to `/scholar/submissions`, and remove the duplicated list from `/scholar`.

### BUG-06: Scholar Dashboard Doesn't Check isActive
- **File:** `src/app/(scholar)/scholar/page.tsx` line 18
- **What's wrong:** The guard is `if (!session || session.user.role !== "SCHOLAR")` — it does not check `session.user.isActive`. A scholar with an inactive account could access the dashboard if they somehow get a session.
- **Fix needed:** Add `|| !session.user.isActive` to the redirect condition (matching the pattern used in middleware/auth-decisions).

---

## 4. Missing Screens

These screens do not exist at all but are needed for a complete product.

### MISSING-01: Paper Detail View for Scholars (Pre-Publication)
- **What's missing:** Scholars can't view the full detail of their own DRAFT or PENDING papers. The only links from the scholar dashboard are "View Public Page" (only if PUBLISHED) and "Revise & Resubmit" (only if RETURNED).
- **Needed:** A `/scholar/papers/[id]` page showing the scholar their own submission — title, abstract, metadata, file name, status, and reviewer feedback if any.

### MISSING-02: Admin Audit Log Page
- **What's missing:** Audit logs are recorded in the database (`AuditLog` model) and 5 recent logs are shown on the admin dashboard. But there is no dedicated page to browse the full audit history with filters (by admin, by action type, by date range).
- **Needed:** `/admin/audit` — a paginated, filterable table of all audit log entries.

### MISSING-03: 404 Not Found Page
- **What's missing:** There is a `/403` error page but no custom `/not-found.tsx` or `404` page.
- **Needed:** `src/app/not-found.tsx` — a branded 404 page consistent with the design system, with a link back to `/`.

### MISSING-04: Admin Analytics / Reports Detail Page
- **What's missing:** The admin dashboard shows 4 aggregate numbers (total papers, scholars, pending, total users). There is no breakdown by field of study, region, year, university, or download counts.
- **Needed:** `/admin/analytics` or expand `/admin` — charts/tables showing submissions over time, most-downloaded papers, breakdown by field/region, scholar activity.

### MISSING-05: Public Scholar Profile Page
- **What's missing:** There is no public-facing page for a scholar. Clicking an author name on a paper detail page or search result has no destination.
- **Needed:** `/scholar/[id]` or `/profile/[id]` — shows a scholar's name, university, published papers list (public info only, no SPAS data).

### MISSING-06: Email Templates / Preview
- **What's missing:** Emails are sent via Nodemailer (verification, password reset) but the templates are defined inline in code. There is no way to preview or test email templates without triggering actual sends.
- **Needed:** Either a dev-only `/dev/emails` preview route, or extraction of templates into standalone HTML files that can be reviewed independently.

---

## 5. Missing Functionality (No New Screen Required)

### FUNC-01: Pagination on Public Search Page
- **Where:** `src/app/(public)/search/page.tsx`
- **Status:** Needs verification — the explore agent noted pagination exists but did not confirm it's fully wired. **Action:** Confirm pagination buttons are functional and not hardcoded disabled like the admin table.

### FUNC-02: Co-Author User Search / Lookup
- **Where:** `src/app/(scholar)/scholar/submit/CoAuthorInput.tsx`
- **Status:** The component exists but it's unclear if the search action is implemented (no server action or API route was found for user search). **Action:** Verify the component can actually look up other registered users by name or email; implement if missing.

### FUNC-03: Admin — Reject a Paper (Permanent)
- **Where:** `/admin/papers/[id]`
- **Status:** The `ReviewActions` component has Publish and Return buttons. It's unclear if a permanent "Reject" (not just return for revision) action exists and is wired. **Action:** Confirm whether REJECTED is a valid end-state in the business logic; if so, ensure the button exists and sets status accordingly.

### FUNC-04: Scholar Cannot Delete a DRAFT
- **Where:** Scholar dashboard / submissions list
- **Status:** There is no delete button for papers in DRAFT status. Scholars can only revise RETURNED papers. **Action:** Add a "Delete Draft" action for papers in DRAFT status (with confirmation dialog).

### FUNC-05: File Replacement on Revision
- **Where:** `src/app/(scholar)/scholar/submit/SubmitPaperForm.tsx`
- **Status:** The form supports `?edit=<id>` mode (revision), but it's unclear whether uploading a new file replaces the old one in Supabase Storage or creates a duplicate. **Action:** Verify that revision uploads correctly replace the old file and clean up storage.

### FUNC-06: Download Count Display
- **Where:** Paper detail page, admin paper review, scholar dashboard
- **Status:** Downloads are tracked in the `Download` model, but no UI displays the download count anywhere. **Action:** Show download count on paper detail page, admin review page, and scholar submission cards.

### FUNC-07: Admin — Activate Scholar vs. Verify Scholar
- **Where:** `/admin/users/[id]`
- **Status:** The page is titled "Verify Scholar Account" and has an Activate/Deactivate toggle. But the concepts of "verification" (SPAS match check) and "activation" (allowing login) are conflated on one page without a clear distinction. **Action:** Clarify in the UI: verification is informational (SPAS match), activation is the actual gate. Consider making activation a separate explicit step with a confirmation.

### FUNC-08: Session Revocation from Profile
- **Where:** `/profile`
- **Status:** The profile page shows active sessions (IP, user agent). It's unclear if individual sessions can be revoked. **Action:** Confirm the "Sign out" action on each session row works; if not, implement it using Better Auth's session management API.

---

## 6. Nice-to-Have Improvements

These are not blockers but would meaningfully improve the product.

### NICE-01: In-App Notifications
- Scholars receive no in-app feedback when their paper is published, returned, or rejected — they must check their email or revisit the dashboard.
- Add a simple notification bell with unread count; notifications created on paper status changes.

### NICE-02: Bulk Admin Actions
- Admin cannot bulk-approve, bulk-reject, or bulk-activate multiple records at once.
- Add checkboxes to the admin papers and users tables with a bulk-action toolbar.

### NICE-03: Full-Text Search
- Current search uses Prisma's `contains` (LIKE queries). For a research repository, full-text search (PostgreSQL `tsvector`) would be significantly better.
- Migrate the search page to use `prisma.$queryRaw` with `to_tsvector` / `plainto_tsquery` or a dedicated search service.

### NICE-04: Paper Revision History
- When a scholar revises and resubmits a RETURNED paper, the previous version and feedback are lost.
- Add a `PaperRevision` table to store snapshots of each submission version with timestamps.

### NICE-05: Role Upgrade Request Flow
- Currently a PUBLIC user who wants to become a SCHOLAR must register as a scholar from the start. There is no way to upgrade later.
- Add a "Become a Scholar" flow from the profile page that collects SPAS info and puts the request in an admin queue.

### NICE-06: CSV Export for Admin Tables
- The Export Report button (once functional) should support CSV download of the papers list with all metadata, useful for DOST-SEI reporting.

### NICE-07: Responsive Mobile Layouts for Admin Tables
- The admin papers table uses fixed-width columns (`w-[180px]`, `w-[140px]`, etc.) that will overflow on mobile screens.
- Add a card-based fallback view for small screens.

### NICE-08: Keyword Autocomplete on Search
- The search page has a plain text input for keywords. Adding an autocomplete that suggests existing keywords from the database would improve discoverability.

---

## 7. Priority Order for Next Steps

### P0 — Fix Before Any Real Usage
1. **BUG-05** — Merge or differentiate `/scholar` and `/scholar/submissions` (remove duplication)
2. **BUG-06** — Add `isActive` check to scholar dashboard guard
3. **BUG-01** — Implement real pagination on admin papers table
4. **MISSING-03** — Add a custom 404 page

### P1 — Core Functionality Gaps
5. **BUG-04** — Wire field/region filters in admin papers UI
6. **BUG-02** — Implement Export Report (CSV download)
7. **BUG-03** — Implement "Request Correction" (email + audit log)
8. **MISSING-01** — Scholar paper detail view (pre-publication)
9. **FUNC-02** — Verify/implement co-author user search
10. **FUNC-04** — Add delete action for DRAFT papers
11. **FUNC-05** — Verify file replacement on revision
12. **FUNC-06** — Show download counts in UI
13. **FUNC-08** — Verify session revocation from profile

### P2 — Admin Completeness
14. **MISSING-02** — Full audit log browser (`/admin/audit`)
15. **FUNC-03** — Confirm/implement permanent paper rejection
16. **FUNC-07** — Clarify verification vs. activation in admin UX
17. **MISSING-04** — Analytics detail page (`/admin/analytics`)

### P3 — Public-Facing Polish
18. **MISSING-05** — Public scholar profile page
19. **NICE-03** — Full-text search upgrade
20. **NICE-01** — In-app notifications
21. **NICE-08** — Keyword autocomplete on search

### P4 — Nice to Have
22. **NICE-02** — Bulk admin actions
23. **NICE-04** — Paper revision history
24. **NICE-05** — Role upgrade request flow (PUBLIC → SCHOLAR)
25. **NICE-06** — CSV export
26. **NICE-07** — Responsive admin tables

---

## 8. File Reference Map

```
src/
├── app/
│   ├── page.tsx                              ← Home page
│   ├── not-found.tsx                         ← MISSING: Add this
│   ├── 403/page.tsx                          ← Access denied
│   ├── (public)/
│   │   ├── search/page.tsx                   ← Public search
│   │   ├── paper/[id]/page.tsx               ← Paper detail (public)
│   │   ├── login/                            ← Auth forms
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify/page.tsx
│   │   └── profile/                          ← User profile + sessions
│   ├── (scholar)/
│   │   └── scholar/
│   │       ├── page.tsx                      ← Scholar dashboard (BUG-05, BUG-06)
│   │       ├── submissions/page.tsx          ← REDUNDANT with dashboard (BUG-05)
│   │       ├── submit/                       ← Paper submission form
│   │       │   ├── page.tsx
│   │       │   ├── SubmitPaperForm.tsx
│   │       │   └── CoAuthorInput.tsx         ← FUNC-02: verify search works
│   │       └── papers/[id]/page.tsx          ← MISSING-01: Add this
│   └── (admin)/
│       └── admin/
│           ├── page.tsx                      ← Dashboard (BUG-02: Export Report)
│           ├── audit/page.tsx                ← MISSING-02: Add this
│           ├── analytics/page.tsx            ← MISSING-04: Add this
│           ├── papers/
│           │   ├── page.tsx                  ← Review queue (BUG-01, BUG-04)
│           │   ├── PaperFilters.tsx          ← BUG-04: missing field/region dropdowns
│           │   ├── ReviewActions.tsx
│           │   └── [id]/page.tsx             ← Paper review
│           └── users/
│               ├── page.tsx                  ← User management
│               ├── UserActions.tsx
│               └── [id]/page.tsx             ← Scholar verification (BUG-03)
├── components/
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
└── lib/
    ├── auth.ts / auth-client.ts / auth-decisions.ts
    ├── db.ts
    ├── crypto.ts                             ← AES encryption for SPAS data
    ├── mailer.ts
    ├── spas.ts
    └── storage.ts
```

---

## 9. Data Models Quick Reference

```
User          id, email, name, role(SCHOLAR|PUBLIC|ADMIN), isActive, emailVerified
ScholarProfile  userId(1:1), spasId(encrypted), fullName(encrypted), university, region
Paper         id, title, abstract, year, university, region, fieldOfStudy,
              advisorName, keywords[], filePath, status(DRAFT|PENDING|PUBLISHED|RETURNED),
              returnFeedback, uploaderId
PaperAuthor   paperId + authorName (+ optional userId) — composite key
Download      paperId, userId, downloadedAt
AuditLog      adminId, paperId?, action, detail, createdAt
SpasRecord    spasId, fullName, birthdate  ← seeded from DOST-SEI DB
Session       userId, token, expiresAt, ipAddress, userAgent
```
