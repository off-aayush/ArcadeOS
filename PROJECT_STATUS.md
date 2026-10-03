## Current Phase
🔵 Phase 9 — Billing + Parlour Profile Polish (Complete)

---

## Completed

- [x] Project Setup
- [x] Prisma Schema
- [x] Seed
- [x] Providers
- [x] Utilities
- [x] Dashboard Layout
- [x] Station Grid & API Endpoint
- [x] Station CRUD
- [x] Customer Module
- [x] Session Engine (Start, Pause, Stop, History, Live Timer)
- [x] Live Cards (Dashboard)
- [x] Products & Categories (Inventory)
- [x] Stock Management (Inventory)
- [x] Inventory ↔ Session ↔ Billing POS flow
- [x] Invoice Generation (Billing)
- [x] Payment Recording (Billing)
- [x] Billing — Discounts & Adjustments
- [x] Reports / Analytics
- [x] Authentication (JWT, login, middleware, topbar)
- [x] Realtime (Socket.IO + custom server)
- [x] Phase 1 — RBAC Foundation
- [x] Phase 2 — Users & Roles (Settings UI)
- [x] Phase 3 — Discounts (Settings UI)
- [x] Phase 4 — Audit Logs (Settings UI)
- [x] Phase 5 — Parlour Profile (Settings UI + migration)
- [x] Phase 6 — Settings UI & Access Control
- [x] Phase 7 — Full Application Authorization Audit

---

## In Progress

None. Application architecture and core features are completely built.

---

## Recently Completed

- **Phase 9 — Billing + Parlour Profile Polish** — Fixed three interrelated issues:
  1. **Invoice Print (multi-page bug):** Added `@media print` block to `globals.css` that hides everything except `#invoice-print-zone`. Print zone is reset to white background with black text. `@page` rule sets A4 portrait with sensible margins. Dialog footer/buttons marked `print:hidden`. Fixed root cause: `window.print()` was printing the entire dark-themed browser page.
  2. **Parlour Profile → Invoice:** Connected existing `ParlourProfile` data to `BillDetailDialog`. Invoices now display business name, tagline, address, phone, email, GSTIN at the top and `receiptFooter` at the bottom. All fields have sensible fallbacks — invoices continue to work with empty profile fields.
  3. **Profile Save UX:** `useUpdateParlourProfile` now sets the React Query cache directly with the server response (no re-fetch delay). `handleSave` on the profile page syncs local form state from the mutation result. Success toast shows `"<name>" updated successfully.` Error toast is now labelled "Save Failed".

- **Phase 8 — Final Features & Polish** — Implemented server-side pagination across `CustomerTable`, `SessionTable`, `BillTable`, and `FoodTable`. Updated customer requirement logic to allow optional customers for walk-ins across session creation and billing. Added "Standalone Inventory Sale" feature to `BillingService` and UI to allow selling inventory without an active session. Implemented client-side `ActiveSessionNotifier` to toast warnings for sessions active for >1 hour.
- **Phase 7 — Full Application Authorization Audit** — Completely refactored `middleware.ts` to implement a centralized, edge-level RBAC authorization matrix for ALL API routes instead of requiring explicit checks in every single route handler. This guarantees no unauthenticated/unauthorized data exposure across `stations`, `sessions`, `customers`, `bills`, `food`, `reports`, `dashboard`, `users`, `discounts`, and `audit-logs`.
- **Phase 6 — Settings UI & Access Control** — Updated `SettingsLayout` to dynamically filter sidebar navigation tabs based on user permissions. Gated `/settings/*` page access at the Next.js Middleware edge. Updated `/settings` index to dynamically redirect to the first available authorized tab.
- **Phase 5 — Parlour Profile** — Added `ParlourProfile` singleton model to Prisma schema (migration `20260829132727_parlour_profile`). Built `ParlourProfileService` with upsert pattern, `/api/parlour-profile` (GET public, PATCH requires `MANAGE_PARLOUR_PROFILE`), React Query hooks, and a rich 4-section Settings page (Business Identity, Contact, Address, Receipt & Billing). Zero TypeScript errors.

- **Phase 10b — Reports Page Layout Polish**
  - **Root Cause of broken pie charts:** `ResponsiveContainer` inside a flex child with `min-h-0` computed to `height: 0px`, causing Recharts to skip rendering entirely. Fixed by replacing all `flex-1 min-h-0` chart containers with explicit `style={{ height: N }}` values.
  - **Natural page scroll:** Removed `h-[calc(100vh-100px)]` fixed viewport height from `reports/page.tsx`. Page now scrolls naturally when content exceeds the viewport.
  - **Layout restructured to 2-row design:**
    - Row 1: Revenue Trend — spans full content width.
    - Row 2: `lg:grid-cols-2` — Revenue by Station/Inventory on the left, Manual Adjustments on the right.
  - **Manual Adjustments redesigned** into a single compact tabbed card (Summary | Categories | Breakdown). The old "Adjustments by Category" separate card is removed.
  - **Files changed:**
    - `src/app/(dashboard)/reports/page.tsx` — removed viewport height clamp, added `pb-8` for scroll padding.
    - `src/features/reports/components/reports-dashboard.tsx` — full layout rewrite; extracted `Spinner`, `EmptyState`, `PieLegend` sub-components; replaced `min-h-0` flex containers with `style={{ height: N }}`; moved pie charts to `lg:grid-cols-2` with Manual Adjustments.
- **Phase 10c — Feature Additions & Polish**
  - **PS2 Station Type:** Added `PS2` to `StationType` Prisma enum (via migration `20261001114028_add_ps2_station_type`). Added to `STATION_TYPE_LABELS` in `constants.ts`. It correctly flows into station creation, editing, session logic, and reports.
  - **Dashboard Revenue Toggle:** Added a localized visibility toggle to the "Today's Revenue" card on the Dashboard. It defaults to hidden (`₹ ••••`) on every page load to protect privacy, and toggles to show the actual value when the eye icon is clicked.
  - **Reports Payment Mode Filter:** Added a Payment Mode dropdown (`ALL`, `UPI`, `CASH`, `CARD`, `WALLET`, `COMPLIMENTARY`) next to the Date Range filter in Reports.
    - Added `paymentMode` to `ReportQueryParams` and correctly mapped it into `URLSearchParams` in the `useReports` frontend hook to ensure the filter actively reaches the backend API.
    - API and `ReportQueryParams` extended to accept `paymentMode`.
    - `ReportService.getDashboardReport` updated to proportionally attribute partial/multiple payments on a bill to Station Revenue, Inventory Revenue, Manual Adjustments, and Total Revenue when a specific mode is selected.
    - Total Revenue, Revenue Trend, Station Pie Chart, Inventory Pie Chart, and Manual Adjustments all update consistently based on the actual recorded Prisma `Payment` values without double counting.
  - **Verification:** Prisma generated successfully, types checked, and `npm run build` completed with zero errors.

## Pending

- None! All planned phases for the ArcadeOS core architecture are complete.

---

## Migrations

- 20260804214607_001_initial
- 20260804215223_002_add_unique_constraints
- 20260808210322_add_food_stock
- 20260822072224_003_station_pricing
- 20260824200306_rbac_foundation ← Adds `roles` table, `Permission` enum, migrates users
- 20260829132727_parlour_profile ← Adds `parlour_profile` singleton table
- 20260930193322_manual_adjustment_type ← Adds Manual Adjustment categorization and backfill

---

- Walk-in Session → Bill Customer Attachment — inline search UI (replaces separate AttachCustomerDialog). Created missing `PATCH /api/bills/[id]/attach-customer` route and `BillingService.attachCustomer` method.
- **Bill number timezone fix** — Replaced UTC-based date in `generateBillNumber` and `nextBillSequence` with local system time, and changed sequence logic from `COUNT(*)` to `MAX(billNumber LIKE 'BILL-YYYYMMDD-%')` to prevent unique-constraint collisions on bills generated around midnight in IST.

---

## Phase 11 — Session Warning Bubble + Application Branding

### Root Cause: Why the old 1-hour toast was unreliable
`ActiveSessionNotifier` ran a 30-second polling `useQuery` with `enabled: true`, but it was mounted in the dashboard layout as a **separate, side-effect-only component** with its own independent `notifiedMap.current` ref. The error in the terminal `[["active-sessions-polling"]]: No queryFn was passed` confirmed that `NotifierLogic` was reading the query by key **without** a `queryFn`, so the query never actually ran in the sub-component — the toast logic was never reached.

### 1. Session 5-Minute Warning Bubble
- **Replaced** the broken global `ActiveSessionNotifier` toast approach entirely.
- **Removed** `ActiveSessionNotifier` from `dashboard/layout.tsx` (no polling needed).
- Added `getApproachingHour(elapsedMs)` pure function to `station-card.tsx`:
  - Takes `elapsedMs` (already calculated correctly in the card, respecting pause/resume).
  - Returns the upcoming hour number (1, 2, 3…) if we're within the last 5 minutes of that hour, otherwise `null`.
  - Works for all hours: 55–60 min → `1`, 115–120 min → `2`, etc.
- Added `warningHour = useMemo(() => getApproachingHour(elapsedMs), [elapsedMs])` — re-derived every second from the existing 1-second interval already running in the card.
- Rendered a **positioned bubble** (`absolute -top-14`) above the card with a CSS downward-arrow pointer. Wrapped each card in a `relative` div for containment.
- Added `pt-16` to the station grid container so bubbles have vertical clearance.
- Warning disappears automatically when: session stops (activeSession becomes null), session is paused (elapsedMs freezes), or page remounts (derived from persisted timestamps).
- No database changes. No new intervals. No global state.

### 2. Application Branding → "The Lobby"
Display name updated to **"The Lobby"** / **"Powered by ArcadeOS"** (secondary) at:
- **Sidebar logo** (`sidebar.tsx`) — stacked "The Lobby" (gradient) + "Powered by ArcadeOS" (9px muted)
- **Sidebar footer** — "The Lobby · Powered by ArcadeOS"
- **Login page** (`login/page.tsx`) — h1 "The Lobby", "Powered by ArcadeOS" subtitle, footer text
- **Root landing page** (`page.tsx`) — "The Lobby" hero heading + "Powered by ArcadeOS" subtext
- **Browser metadata** (`layout.tsx`) — title template `%s | The Lobby`, default title `The Lobby — Gaming Lounge Management`
- Invoice header (`bill-detail-dialog.tsx`) — unchanged; uses `profile?.name ?? "My Arcade"` (dynamic parlour data, not app name)

Internal code identifiers, database, env vars, package name, API routes — **unchanged**.

### Files Changed
- `src/features/stations/components/station-card.tsx` — getApproachingHour helper, warningHour useMemo, warning bubble UI
- `src/features/stations/components/station-grid.tsx` — pt-16 for bubble clearance
- `src/app/(dashboard)/layout.tsx` — removed ActiveSessionNotifier
- `src/components/layout/sidebar.tsx` — new branding
- `src/app/login/page.tsx` — new branding
- `src/app/page.tsx` — new branding
- `src/app/layout.tsx` — updated metadata
- `src/app/api/bills/[id]/attach-customer/route.ts` — **created** (was missing, caused "No queryFn" error)
- `src/features/billing/services/billing.service.ts` — added `attachCustomer` static method

### Verification
- Build: ✅ `npm run build` — 0 type errors, 0 lint errors (after `.issues` fix)
- Warning bubble derived purely from `elapsedMs`, which correctly pauses/resumes with the session.
- Multiple stations each show their own independent bubble based on their own session's elapsed time.
- Old `active-session-notifier.tsx` retained in filesystem (unused) for reference.

---

## Known Issues

- None

---

## Exact Next Task

**🎉 ArcadeOS MVP is Complete!**

Next logical steps for the project owner:
1. Conduct end-to-end user testing.
2. Deploy to a staging environment.
3. Review production environment variable checklist in `README.md`.