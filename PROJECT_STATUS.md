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
  - **Walk-in Customer Pipeline Fix:** Fixed the Walk-in Customer lifecycle.
    - Walk-in sessions now generate bills properly when stopped.
    - A new `AttachCustomerDialog` was created (`src/features/billing/components/attach-customer-dialog.tsx`) to allow attaching existing or newly-enrolled customers to an active bill directly from the `BillDetailDialog`.
    - Added a new endpoint (`PATCH /api/bills/[id]/attach-customer`) that safely sets the `customerId` on both the Bill and its associated Session.
    - Unattached walk-in bills can still proceed to payment normally.
    - The schema handles `customerId` nullability perfectly; no DB migrations were required.
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

## Known Issues

- None

---

## Exact Next Task

**🎉 ArcadeOS MVP is Complete!**

Next logical steps for the project owner:
1. Conduct end-to-end user testing.
2. Deploy to a staging environment.
3. Review production environment variable checklist in `README.md`.