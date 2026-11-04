# Roadmap

Updated 2026-11-04. The core application is implemented. Release verification and deployment remain.

## Delivered

- [x] Stations, player pricing, live sessions, and session-hour warnings.
- [x] Customers, completed-visit heatmap with yearly summaries, inventory, stock, session orders, and standalone sales.
- [x] Bills, customer-name search, invoices, discounts, adjustments, partial payments, payment-mode details, and zero-value settlement.
- [x] Staff login, roles and permissions, audit logs, business profile, and reports.
- [x] Protection against duplicate standalone item requests and concurrent stock claims in the billing flow.

## Before release

- [ ] Manually test the Billing modal and printed invoice in a browser: unpaid, UPI, split payments, zero-value settlement, and the required payment-method prompt.
- [ ] Check the customer visit popup in a browser at desktop and phone widths: hover, keyboard focus, tap, year navigation, summaries, date details, and edge positioning.
- [ ] Test adding several products to one standalone sale, stock exhaustion, repeated submissions, paid-bill rejection, and session ordering in staging.
- [ ] Apply all migrations to the target database with `npx prisma migrate deploy`, then smoke-test with a staff account. The configured local database was up to date with 11 migrations on 2026-11-04; other environments must be checked separately.
- [ ] Set production secrets, change seeded passwords if those accounts exist, back up the target database, and run the custom `server.ts` process behind the chosen deployment setup.

Browser regression tests are not yet committed. The billing and inventory service and API flows were exercised against an isolated test database, and customer visit aggregation was checked against the local database; see [PROJECT_STATUS.md](PROJECT_STATUS.md). Setup instructions are in [README.md](README.md).
