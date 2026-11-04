# ArcadeOS / The Lobby

ArcadeOS is the codebase for **The Lobby**, a web app for running a gaming lounge. Staff can manage stations and sessions, sell inventory, issue bills, record payments, and view reports.

## What is included

- Live station and session views, with per-player pricing and a warning before each session hour.
- Customer records with a completed-visit calendar, inventory and stock, session orders, and standalone inventory sales.
- Bills with customer-name search, discounts, adjustments, partial payments, payment-mode details, invoices, and explicit settlement of zero-value bills.
- Staff roles, permissions, audit logs, business profile settings, and reports with a payment-mode filter.

## Run locally

You need Node.js, npm, and a PostgreSQL database that already exists.

1. Install packages: `npm install`.
2. Copy `.env.example` to `.env`. Set `DATABASE_URL`, `AUTH_SECRET` (at least 32 characters), and `NEXT_PUBLIC_APP_URL`.
3. Apply the versioned schema: `npx prisma migrate deploy`.
4. Generate the database client: `npm run db:generate`.
5. On a **new local database only**, run `npm run db:seed` to create demo staff, stations, products, and discounts.
6. Start the app: `npm run dev`. Open `http://localhost:3000`.

The seed prints demo login credentials. Change those passwords before sharing the app. **Do not rerun the seed on an existing installation:** it resets the three seeded users' passwords.

## Build and run

Run `npm run type-check` and `npm run build` before release. For an existing database, apply new migrations with `npx prisma migrate deploy` before starting the updated app. Start the production build with `npm run start`; `server.ts` runs Next.js and Socket.IO together. Never use `db:reset` or `db:push` on an existing database.

## Project notes

- [Current status](PROJECT_STATUS.md): completed work, verification, and remaining checks.
- [Roadmap](ROADMAP.md): release work still to do.
- [Architecture](ARCHITECTURE.md): how the app and billing data fit together.
