# Architecture

ArcadeOS is a Next.js 15 application with a custom Node.js server. The server runs Next.js and Socket.IO on the same port. PostgreSQL stores operational data; Prisma owns the schema and versioned migrations.

```text
Browser (pages, dialogs, TanStack Query)
    -> Next.js API routes
    -> feature services and validators
    -> Prisma -> PostgreSQL
    <- Socket.IO invalidation events for live views
```

## Main parts

- `src/app/(dashboard)` contains the staff pages. `src/features` contains their components, hooks, validators, and services.
- `src/middleware.ts` verifies the JWT cookie and checks permissions for protected pages and API route prefixes. Roles and permissions are stored in the database.
- API routes validate input and call feature services. Services own billing and stock rules; Prisma queries and transactions persist changes.
- `src/providers/socket-provider.tsx` listens for server events so relevant views can refresh. The custom entry point is `server.ts`.
- `prisma/schema.prisma` defines the data model. New schema changes belong in new files under `prisma/migrations`; existing migrations are not edited.

## Customers and visit history

The Customers table paginates and filters customers on the server. Its Visits count comes from completed `Session` records; the stored `Customer.totalVisits` field is still incremented by the older first-payment workflow and can differ. The on-demand `/api/customers/[id]/visits` route groups every completed session by its `startTime` calendar day in the configured parlour timezone. The calendar caches each customer's result, shows one year at a time, and derives its yearly summaries from the same daily counts. Active, paused, and cancelled sessions are excluded.

## Billing and inventory

A `Session` can have one `Bill`. A standalone inventory sale has a `Bill` without a session. A bill may have a customer, many `BillItem` rows, and many `Payment` records. Each payment stores its actual method (`CASH`, `UPI`, `CARD`, `WALLET`, or `COMPLIMENTARY`); the invoice shows completed payments by method. Bill summaries store subtotal, discounts, adjustments, rounding, total, paid amount, and due amount.

Session orders use `/api/sessions/[id]/orders`. Adding to an existing standalone sale uses `/api/bills/[id]/orders`; it changes that unpaid bill and claims stock in a transaction. A unique, nullable `BillItem.idempotencyKey` makes a retried standalone addition safe without changing historical items. Stock claims require enough remaining stock. Payment writes also use a transaction.

Bills move from `DRAFT` or `PENDING` to `PARTIALLY_PAID` or `PAID` as payments arrive. A pending bill with a zero total has a separate explicit settlement action: it becomes `PAID` without a fabricated payment. Paid bills cannot accept more inventory items through this workflow. Discounts and credits cannot make the payable total negative.

The Billing table searches customer names on the server. It displays a linked session's creation date when available and falls back to the bill's creation date for standalone sales. Recording a payment requires an explicit method selection.

Reports read bills and payments and can filter revenue by recorded payment method. The business profile supplies invoice identity and receipt text. `BillDetailDialog` renders the invoice and prints it through an isolated iframe.

For setup and deployment commands, see [README.md](README.md). For the current migration and verification state, see [PROJECT_STATUS.md](PROJECT_STATUS.md).
