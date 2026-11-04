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

---

## Customer Visit Calendar Heatmap (2026-11-03)

- The Customers table's Visits count now comes from completed session records. Each completed session counts once, including unpaid completed sessions; active, paused, and cancelled sessions are excluded. The stored `Customer.totalVisits` field is still incremented on first payment by the existing billing workflow, so it can differ from this visit-based display count.
- Hover, focus, or tap a Visits count to load that customer's full completed-session history on demand. The popup uses a portal and viewport-aware positioning, with loading, empty, retry, Escape, outside-click, keyboard date navigation, year navigation, date/count details, and a purple intensity legend. React Query caches each customer's history for the existing customer stale time.
- The visit-history API groups sessions by `startTime` date in the configured parlour timezone. It returns all years; the calendar shows one year at a time. No schema or migration changes.
- Files: `src/features/customers/services/customer.service.ts`, `src/app/api/customers/[id]/visits/route.ts`, `src/features/customers/components/visit-heatmap.tsx`, `src/features/customers/components/customer-table.tsx`.
- Verification: TypeScript check and production build passed. Read-only PostgreSQL checks covered zero visits, one visit, multiple sessions on one date, dates across months/years, active/paused/cancelled exclusion, UTC-to-parlour-day conversion, and equality of grouped totals and completed-session counts. Live customer service checks covered search, pagination, list/heatmap total agreement, and a missing customer. Server-rendered calendar checks covered empty, one-visit, multiple-visit, and multi-year output and intensity.
- Known verification gap: automated browser interaction and popup placement could not be exercised because the computer-use tool stopped when it could not verify the Chrome URL. Hover/focus/tap, viewport edges, and touch behavior still need a manual browser check.

### Popup refinement (2026-11-03)

- Updated `src/features/customers/components/visit-heatmap.tsx` only. The popup now shows `Visit Calendar · Customer Name`, an emphasized selected year, and four compact summaries for that year: Total Visits, Active Days, Last Visit, and Busiest Day. The all-time completed visit count remains visible in the header.
- Replaced the fixed calendar width and scroll containers with viewport-based cell and gap sizing. The popup grows to its content height, uses the existing body portal, and scales only when its natural height would exceed a short viewport. All month labels and date cells fit within the popup; no scrollbar or clipped calendar is used. The purple intensity scale, neutral empty dates, date/count details, legend, cached API request, and keyboard/touch interactions remain.
- Verification: `npm run type-check` and `npm run build` passed. Render checks covered zero, one, multiple same-day and multi-year visits. Geometry checks covered 52–54 calendar weeks at viewport widths 240, 280, 320, 375, 600, 768, and 1280 pixels, plus popup placement at desktop and phone sizes, including near viewport edges.
- Known verification gap: automated browser inspection remains unavailable because the computer-use tool could not verify Chrome's current URL. Visual placement and touch behavior still need a manual browser check.
