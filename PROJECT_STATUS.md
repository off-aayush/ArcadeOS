# Project status

Updated 2026-10-31. **Core features are implemented; release verification is still open.** The application is branded **The Lobby** and the codebase remains ArcadeOS.

## Implemented

- Stations: CRUD, station types including PS2, per-player pricing, live availability, and a five-minute warning before each session hour.
- Sessions and customers: start, pause, resume, stop, history, optional walk-in customers, and customer attachment to an unpaid bill.
- Inventory and billing: product and stock management, session orders, standalone inventory sales, invoice generation and printing, discounts, manual adjustments, partial payments, and payment-mode reporting.
- Administration: JWT login, role and permission checks, staff management, audit logs, business profile and receipt details, dashboard revenue visibility toggle, and reports filtered by payment method.
- Live updates: the custom Next.js and Socket.IO server emits invalidation events for relevant views.

## Recent billing work

- The bill detail view groups completed `Payment` records by method and shows their amounts. Unpaid bills say **No payment recorded**; the invoice also shows paid and due totals.
- Staff can explicitly mark a pending zero-value bill as `PAID`. The server records a paid timestamp and audit update without creating a fake payment. The action rejects repeat settlement; positive-balance bills keep the normal payment rules.
- An unpaid standalone inventory-sale bill can accept more items through the existing catalogue modal. The item-add API updates the same bill, recalculates totals, and conditionally claims stock inside a serializable transaction. Retried requests use a stored idempotency key. Session ordering keeps its own route.
- Shared bill recalculation prevents negative totals or totals below an amount already paid; excessive manual credits are rejected.
- Record Payment now starts with **None** instead of Cash. Submitting without a method stops before the API call and shows a field error. The server validator also rejects a missing or invalid method. The error uses the occupied-station danger border and glow while the native dropdown menu keeps its normal background.

## Database and migration state

There are **11 versioned Prisma migrations**. The latest, `20261031000000_bill_item_add_idempotency`, adds a nullable unique request key to bill items. Existing bill items remain valid without a key. `npx prisma migrate status` reported the configured **local** database up to date on 2026-10-31. Migration state in staging and production is unknown and must be checked there before deploying updated code.

## Verification

- Prisma schema validation and client generation passed for the billing and inventory changes. TypeScript checks and a full production build passed on the current code after the payment-method UI changes.
- A temporary test harness created an isolated PostgreSQL database, applied all 11 migrations, exercised the billing service and item-add API, and removed that database. Assertions covered a full UPI payment, UPI plus Cash partial payments, an unpaid bill, explicit zero-value settlement without a payment, duplicate settlement, multiple items on the same standalone bill, request replay, concurrent stock claims, insufficient stock, paid-bill rejection, excessive credit, and a session order. All passed. The harness was intentionally removed from the repository.
- No browser walkthrough or printed-invoice visual check has been recorded for the latest changes.

## Remaining work and known behavior

1. Complete the browser and staging checks in [ROADMAP.md](ROADMAP.md), including the payment-method error styling and printed invoice.
2. Apply pending migrations in each target environment before starting updated code. Do not reset the database or use `db push` on an existing installation.
3. Consider adding permanent automated browser regression tests; none are currently committed.

Repeated additions of one product to a standalone bill appear as separate invoice lines. This preserves the price snapshot and replay key for each addition. No other current issue is confirmed by the checks above.

See [README.md](README.md) for setup and [ARCHITECTURE.md](ARCHITECTURE.md) for the main data flow.
