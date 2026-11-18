# Project status

Updated 2026-11-18. ArcadeOS powers **The Lobby**. Core features and Spendings are implemented; browser checks, staging checks, and deployment remain.

## Implemented

- Stations and sessions: station management, player pricing, live availability, start/pause/resume/stop, session history, and a warning before each session hour.
- Customers: records, search and pagination, optional walk-in customers, customer attachment to an unpaid bill, and a completed-visit calendar.
- Inventory and billing: products, stock, session orders, standalone sales, discounts, manual adjustments, invoices, partial payments, zero-value settlement, and reports filtered by payment method.
- Administration and live updates: JWT login, roles and permissions, staff, audit logs, business profile, dashboard revenue visibility control, and Socket.IO invalidation events.
- Spendings: a Super Admin-only expense ledger with create/edit forms, historical spending dates, a responsive trend chart, and a paginated list.

## Spendings

- The new `Spending` model stores name, optional description, positive `Decimal(12,2)` amount, editable `spentAt`, creation/update timestamps, creator/updater relations, and an optional unique request key for safe create retries. The additive migration `20261118000000_add_spendings` creates only its table, indexes, foreign keys, and positive-amount constraint.
- `/spendings` shows a spending trend above records. A shared date-range selection filters both. The server aggregates by `spentAt` in the parlour timezone using daily, weekly, or monthly periods; the list uses server-side pagination and newest-spending-first order. An edit invalidates both cached queries. Historical entries outside the selected range switch the view to their month after saving.
- The form defaults to the current local date/time, validates name, amount, and date on the client and server, provides loading/success/error feedback, and confirms before discarding unsaved changes. Each successful edit changes `updatedAt` and `updatedBy` while retaining the creator and creation timestamp.
- Only an authenticated user with the exact `SUPER_ADMIN` role can see the navigation item or use the page and API. Middleware and API handlers return 403 for other roles; every spending service operation checks the user's current active role in the database. Spendings do not alter bills, customer payments, inventory stock, or revenue.
- Files: `prisma/schema.prisma`, `prisma/migrations/20261118000000_add_spendings/migration.sql`, `src/middleware.ts`, `src/components/layout/sidebar.tsx`, `src/app/(dashboard)/spendings/page.tsx`, `src/app/api/spendings/`, and `src/features/spendings/`.

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

There are **12 versioned Prisma migrations**. The latest, `20261118000000_add_spendings`, adds the separate expense ledger without changing historical billing or customer data. It passed deployment and data tests in an isolated database before being applied to the configured local database on 2026-11-18. Migration state in staging and production has not been checked. No migration was needed for the visit calendar.

## Verification

- Prisma schema validation, client generation, TypeScript checks, and a production build passed during the billing and customer feature work.
- An isolated PostgreSQL test database was used for billing service and API checks, then removed. Checks covered UPI and split payments, unpaid bills, zero-value settlement, replayed item requests, concurrent and insufficient stock claims, paid-bill rejection, excessive credit, and session ordering.
- Read-only customer visit checks covered zero and one visit, multiple visits on one day, dates across months and years, excluded session statuses, timezone conversion, and agreement between the table's completed-session count and the heatmap total. Customer search and pagination were also checked.
- Calendar render and placement calculations were checked with empty and populated histories, 52-54 week layouts, and viewport widths from 240 to 1280 pixels. `npm run type-check` and `npm run build` passed after the popup refinement.
- Spendings: Prisma validation/client generation, TypeScript checking, and a production build passed. An isolated PostgreSQL database applied all 12 migrations, then tested creation, history dates crossing a local month boundary, edit attribution/timestamps, chart totals after edits, daily/weekly/monthly grouping, pagination/sorting, duplicate request replay and conflict, invalid amounts, role denials in middleware/API/service, and separation from bills/payments/inventory. The temporary database and test script were removed. The additive migration was then applied to the configured local database.
- A browser walkthrough of Spendings, the customer popup, and the latest billing/printed-invoice UI has not been recorded. Form interaction, visual placement, keyboard and touch behavior, and printed output still need hands-on checks.

## Remaining work and known behavior

1. Complete the browser and staging checks in [ROADMAP.md](ROADMAP.md), including Spendings, the customer popup, payment-method prompt, and printed invoice.
2. Apply and verify migrations in each target environment before running updated code. Avoid `db:reset` and `db:push` on an existing installation.
3. Consider permanent browser regression tests; none are committed.

Repeated additions of one product to a standalone bill appear as separate invoice lines so each addition keeps its price snapshot and replay key. The stored customer visit counter's payment-based behavior is described above.

For setup, see [README.md](README.md). For the data flow, see [ARCHITECTURE.md](ARCHITECTURE.md).
