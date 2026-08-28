## Current Phase
🔵 Phase 4 — Audit Logs (Complete) / Phase 5 — Parlour Profile (Next)

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
- [x] Phase 1 — RBAC Foundation (Permission enum, Role model, migration, permissions utility)
- [x] Phase 2 — Users & Roles (Settings UI)
- [x] Phase 3 — Discounts (Settings UI)
- [x] Phase 4 — Audit Logs (Settings UI)

---

## In Progress

Phase 5 — Parlour Profile (Settings page)

---

## Recently Completed

- **Phase 4 — Audit Logs** — Created backend service and UI for the immutable audit logs system. Added pagination and sorting, protected by `VIEW_AUDIT_LOGS` permission. Built `AuditLogTable` with metadata JSON viewer modal.
- **Phase 3 — Discounts** — Expanded `DiscountService` with full CRUD capabilities. Built `/api/discounts` full suite with `MANAGE_DISCOUNTS` authorization. Built `DiscountTable` and `DiscountFormDialog` with full toggle and conflict handling UI matching stations/billing.
- **Phase 2 — Users & Roles** — Created `UserService` with full CRUD. Built `UserTable`, `UserCreateDialog`, and `UserEditDialog` with role assignment, soft delete logic, password change capability, and preventing `SUPER_ADMIN` demotion. Applied universal modal styling consistency.
- **Phase 1 — RBAC Foundation** — Replaced `UserRole` enum with a `Role` model and `Permission[]` array. Seeded 3 system roles (SUPER_ADMIN, ADMIN, RECEPTIONIST) with granular permissions. Created `src/lib/permissions.ts` with `hasPermission()`, `hasAnyPermission()`, and `requirePermission()` utilities for API guards.

## Pending

- Phase 5 — Parlour Profile (Settings page)
- Phase 6 — Settings UI & Access Control (Final integrations)
- Phase 7 — Full Application Authorization Audit

---

## Migrations

- 20260804214607_001_initial
- 20260804215223_002_add_unique_constraints
- 20260808210322_add_food_stock
- 20260822072224_003_station_pricing
- 20260824200306_rbac_foundation ← Adds `roles` table, `Permission` enum, migrates users

---

## Phase 4 — Audit Logs Changes

### Files Modified
- None existing.

### Files Created
- `src/features/audit-logs/types.ts`
- `src/features/audit-logs/services/audit.service.ts`
- `src/features/audit-logs/hooks/use-audit-logs.ts`
- `src/features/audit-logs/components/audit-log-table.tsx`
- `src/app/api/audit-logs/route.ts`
- `src/app/(dashboard)/settings/audit-logs/page.tsx`

### Verification Performed
- ✅ TypeScript type-check passes with zero errors (`npm run type-check`)
- ✅ API correctly restricts access to users with `VIEW_AUDIT_LOGS`
- ✅ Audit Log table renders cleanly and displays correctly parsed JSON metadata payload in standard modal format.

---

## Known Issues

- None

---

## Exact Next Task

1. Implement **Phase 5 — Parlour Profile** (Settings page).
2. Create settings storage in Prisma schema or file system.
3. Build the backend API to store and retrieve Parlour Profile settings (name, address, GSTIN, receipt footer).
4. Create the Settings UI layout to manage the profile.