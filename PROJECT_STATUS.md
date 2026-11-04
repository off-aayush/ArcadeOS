# Project status

Updated 2026-11-04. ArcadeOS powers **The Lobby**. Core features are implemented; browser checks, staging checks, and deployment remain.

## Implemented

- Stations and sessions: station management, player pricing, live availability, start/pause/resume/stop, session history, and a warning before each session hour.
- Customers: records, search and pagination, optional walk-in customers, customer attachment to an unpaid bill, and a completed-visit calendar.
- Inventory and billing: products, stock, session orders, standalone sales, discounts, manual adjustments, invoices, partial payments, zero-value settlement, and reports filtered by payment method.
- Administration and live updates: JWT login, roles and permissions, staff, audit logs, business profile, dashboard revenue visibility control, and Socket.IO invalidation events.

## Customer visit calendar

- The Customers table derives its Visits count from completed session records. It excludes active, paused, and cancelled sessions. Multiple completed sessions on one day count separately.
- Hovering, focusing, or tapping a Visits count loads that customer's full visit history on demand through `/api/customers/[id]/visits`. The service groups sessions by their `startTime` date in the configured parlour timezone; all years are available. React Query caches each customer's result.
- The popup shows the customer's name, purple intensity by daily count, exact date/count details, a legend, and year navigation. Its Total Visits, Active Days, Last Visit, and Busiest Day cards reflect the selected year; the header keeps the all-time total. The popup renders outside the table and fits the calendar without scrollbars.
- Files: `src/features/customers/components/customer-table.tsx`, `src/features/customers/components/visit-heatmap.tsx`, `src/features/customers/services/customer.service.ts`, and `src/app/api/customers/[id]/visits/route.ts`.
- The stored `Customer.totalVisits` field still increments on a session bill's first payment. It may differ from the completed-session count shown in the Customers table. This historical counter behavior has not been migrated or changed.

## Billing and inventory

- Billing supports customer-name search. The table and detail dialog show the linked session's creation date when available, or the bill's creation date for a standalone sale.
- Record Payment starts with **None** and requires staff to choose a method. Submitting without one shows a field error before the API call; server validation also rejects an invalid or missing method.
- The bill detail and invoice show completed payments by method, along with paid and due totals. Printing uses an isolated iframe.
- A pending zero-value bill can be explicitly marked `PAID` without creating a payment. Repeat settlement and positive-balance settlement are rejected.
- Staff can add items to an unpaid standalone bill. A nullable unique `BillItem.idempotencyKey` protects retries, and stock claims and bill recalculation run in transactions. Paid bills reject further additions. Excessive credits cannot reduce the total below zero or an amount already paid.

## Database and migrations

There are **11 versioned Prisma migrations**. The latest, `20261031000000_bill_item_add_idempotency`, adds the nullable unique bill-item request key without changing historical items. `npx prisma migrate status` reported the configured local database up to date on 2026-11-04. Migration state in other environments has not been checked. No migration was needed for the visit calendar.

## Verification

- Prisma schema validation, client generation, TypeScript checks, and a production build passed during the billing and customer feature work.
- An isolated PostgreSQL test database was used for billing service and API checks, then removed. Checks covered UPI and split payments, unpaid bills, zero-value settlement, replayed item requests, concurrent and insufficient stock claims, paid-bill rejection, excessive credit, and session ordering.
- Read-only customer visit checks covered zero and one visit, multiple visits on one day, dates across months and years, excluded session statuses, timezone conversion, and agreement between the table's completed-session count and the heatmap total. Customer search and pagination were also checked.
- Calendar render and placement calculations were checked with empty and populated histories, 52-54 week layouts, and viewport widths from 240 to 1280 pixels. `npm run type-check` and `npm run build` passed after the popup refinement.
- A browser walkthrough of the customer popup and the latest billing/printed-invoice UI has not been recorded. Visual placement, keyboard and touch interaction, and printed output still need hands-on checks.

## Remaining work and known behavior

1. Complete the browser and staging checks in [ROADMAP.md](ROADMAP.md), including the customer popup, payment-method prompt, and printed invoice.
2. Apply and verify migrations in each target environment before running updated code. Avoid `db:reset` and `db:push` on an existing installation.
3. Consider permanent browser regression tests; none are committed.

Repeated additions of one product to a standalone bill appear as separate invoice lines so each addition keeps its price snapshot and replay key. The stored customer visit counter's payment-based behavior is described above.

For setup, see [README.md](README.md). For the data flow, see [ARCHITECTURE.md](ARCHITECTURE.md).
