## Current Phase
🔵 Phase 1 — RBAC Foundation (Complete) / Phase 2 — Users & Roles (Next)

---

## Completed

- [x] Project Setup
- [x] Prisma Schema
- [x] Seed
- [x] Providers
- [x] Utilities
- [x] Dashboard Layout
- [x] Station Grid & API Endpoint (Phase 1)
- [x] Station CRUD
- [x] Customer Module (types, validators, service, API, components, page)
- [x] Session Engine (Start, Pause, Stop, History, Live Timer)
- [x] Live Cards (Dashboard Phase)
- [x] Running Timers Overview (Dashboard Phase)
- [x] Products & Categories (Inventory Phase)
- [x] Stock Management (Inventory Phase)
- [x] Inventory ↔ Session ↔ Billing POS flow
- [x] Invoice Generation (Billing Phase)
- [x] Payment Recording (Billing Phase)
- [x] Billing — Discounts & Adjustments (Billing Phase)
- [x] Reports (Billing Phase)
- [x] Authentication (JWT, login page, middleware, topbar logout)
- [x] Realtime (WebSockets via Socket.IO, custom server, global emitters)
- [x] **Phase 1 — RBAC Foundation** (Permission enum, Role model, migration, permissions utility)

---

## In Progress

Phase 2 — Users & Roles (Settings UI)

---

## Recently Completed

- **Phase 1 — RBAC Foundation** — Replaced `UserRole` enum with a `Role` model and `Permission[]` array. Seeded 3 system roles (SUPER_ADMIN, ADMIN, RECEPTIONIST) with granular permissions. Created `src/lib/permissions.ts` with `hasPermission()`, `hasAnyPermission()`, and `requirePermission()` utilities for API guards.
- **Per-Player Station Pricing** — Dynamic pricing table based on max players, snapshotted rate on session start, and full radio-button selection UI on the dashboard.
- **Customers** — Fixed statistics tracking (`totalVisits`, `totalSpend`) to accurately update in a single transaction during bill finalization/payment.
- **Billing / Payments** — Fixed discount state issues, blocked negative bill totals, added ability to remove discounts and manual adjustments via UI, fixed payment modal stale state issue.
- **Reports / Analytics** — Date-range filter (From → To, presets), daily revenue bar chart, dual pie chart (station gaming revenue vs. inventory revenue with toggle), all server-side filtered.

## Pending

- Phase 2 — Users & Roles (Settings page)
- Phase 3 — Discounts (Settings page)
- Phase 4 — Audit Logs (Settings page)
- Phase 5 — Parlour Profile (Settings page)
- Phase 6 — Settings UI & Access Control
- Phase 7 — Full Application Authorization Audit

---

## Migrations

- 20260804214607_001_initial
- 20260804215223_002_add_unique_constraints
- 20260808210322_add_food_stock
- 20260822072224_003_station_pricing
- 20260824200306_rbac_foundation ← Adds `roles` table, `Permission` enum, migrates users

---

## Phase 1 — RBAC Foundation Changes

### Files Modified
- `prisma/schema.prisma` — Removed `UserRole` enum; added `Permission` enum + `Role` model; updated `User.roleId` FK
- `prisma/migrations/20260824200306_rbac_foundation/migration.sql` — Custom SQL: creates roles table, seeds 3 system roles, migrates existing users
- `prisma/seed.ts` — Updated to use `roleId` instead of `UserRole` enum
- `src/features/auth/types/index.ts` — Updated `SessionUser` and `AuthUser` to embed `role.{id, name, permissions[]}`
- `src/features/auth/services/auth.service.ts` — Added `include: { role: true }` to both queries
- `src/types/index.ts` — Replaced `UserRole` with `Permission` and `Role` exports
- `src/middleware.ts` — Updated `x-user-role` header to use `user.role.name`
- `src/components/layout/topbar.tsx` — Updated role label lookup to use `user.role.name`

### Files Created
- `src/lib/permissions.ts` — `hasPermission()`, `hasAnyPermission()`, `requirePermission()` utilities

### Verification Performed
- ✅ Migration applied cleanly (`prisma migrate dev`)
- ✅ Seed script ran successfully (3 roles seeded, 2 users created with role FKs)
- ✅ TypeScript type-check passes with zero errors (`npm run type-check`)

---

## Known Issues

- [x] Paused Session Cannot Be Resumed/Stopped - **Resolved**
- [x] Bill Preview Modal UI choppy edges and scrolling - **Resolved**

---

## Technical Debt

None