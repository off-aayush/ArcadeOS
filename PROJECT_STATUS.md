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

- **Phase 10 — Manual Adjustments Feature**
  - **Schema:** Added `ManualAdjustmentType` enum (`ADJUSTMENTS`, `FRIENDS`, `ROUND_OFF`, `OTHERS`) and `manualAdjustmentType` column to `BillItem`.
  - **Migration:** Created `20260930193322_manual_adjustment_type` with safe SQL backfill parsing existing text descriptions to set the correct enum value for legacy records.
  - **Backend:** Updated `BillingService.addAdjustment` to calculate `finalDescription` cleanly and store `manualAdjustmentType`. Updated validators to require descriptions when `OTHERS` is selected.
  - **Reports API:** Updated `ReportService` to aggregate manual adjustments by counting totals for credits, charges, and category-level breakdown without using a new date scheme.
  - **UI/Billing:** Updated `AddAdjustmentDialog` to include the new Category dropdown and conditionally enforce the description requirement for `OTHERS`.
  - **UI/Reports:** 
    - Appended a dedicated "Manual Adjustments Summary" and "Adjustments by Category" row to `ReportsDashboard`, reusing the existing date filters and data structures.
    - Redesigned Manual Adjustments into a single compact card with exactly 3 switchable tabs (Summary, Categories, Breakdown).
    - Replaced the large list with a dynamically rendered Pie/Doughnut Chart for category totals, fully equipped with a custom tooltip displaying amount/count.
    - Fixed a bug where Recharts Pie Charts failed to render due to zero-height constraints (`min-h-0` inside a flex child without intrinsic height). Implemented hard boundaries (e.g. `min-h-[250px]`) allowing charts to properly initialize responsive bounds.
    - Restored natural page scrolling for the Reports page by removing overly restrictive absolute viewport clamps, ensuring responsive layouts function as intended across breakpoints.

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