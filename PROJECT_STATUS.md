## Current Phase
🟢 Phase 9 - Realtime (Complete)

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

---

## In Progress

---

## Recently Completed

- **Billing / Payments** — Fixed discount state issues, blocked negative bill totals, added ability to remove discounts and manual adjustments via UI, fixed payment modal stale state issue.
- **Reports / Analytics** — Date-range filter (From → To, presets), daily revenue bar chart, dual pie chart (station gaming revenue vs. inventory revenue with toggle), all server-side filtered.

## Pending

---

## Migrations

- 001_initial

---

## Known Issues

- [x] Paused Session Cannot Be Resumed/Stopped - **Resolved**
- [x] Bill Preview Modal UI choppy edges and scrolling - **Resolved**

---

## Technical Debt

None