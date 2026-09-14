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

---

## Phase 6 & 7 Changes

### Files Modified
- `src/middleware.ts` — Implemented central RBAC map for `/api/*` routes and page gating for `/settings/*`.
- `src/app/(dashboard)/settings/layout.tsx` — Conditionally render tabs based on `user.role.permissions`.
- `src/app/(dashboard)/settings/page.tsx` — Server-side redirect to the first authorized settings page.

### Verification Performed
- ✅ `npm run type-check` — zero errors
- ✅ Edge middleware correctly parses JWT and validates the requested path prefix against the required `Permission` array.

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