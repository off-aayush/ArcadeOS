# ArcadeOS

**Realtime Gaming Lounge Management Platform**

A full-featured arcade/gaming parlour management system built with Next.js 15, Socket.IO, Prisma, and PostgreSQL. Manage stations, sessions, billing, inventory, customers, staff, and more — all in realtime.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime / WebSockets | Custom Node.js + Socket.IO server (`server.ts`) |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT via `jose` (HTTP-only cookie) |
| Styling | Tailwind CSS v4 + Radix UI |
| State | TanStack Query v5 + Zustand |
| Language | TypeScript |

---

## Prerequisites

Make sure the following are installed on the machine:

- **Node.js** v18 or later
- **npm** v9 or later
- **PostgreSQL** 14 or later (local install _or_ a hosted provider like [Supabase](https://supabase.com), [Neon](https://neon.tech), or Railway)

---

## Quick Setup (Local Dev)

### 1. Clone the repo

```bash
git clone https://github.com/off-aayush/ArcadeOS.git
cd ArcadeOS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your `.env` file

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

Then open `.env` and set:

```env
# Required — PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/arcadeos"

# Required — JWT signing secret (min 32 characters, keep this private)
AUTH_SECRET="replace-with-a-long-random-secret-string"

# Required — App base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional — displayed in the UI
NEXT_PUBLIC_APP_NAME="ArcadeOS"
NEXT_PUBLIC_CURRENCY="INR"
NEXT_PUBLIC_CURRENCY_SYMBOL="₹"
```

> **Generate a strong `AUTH_SECRET`:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Create the PostgreSQL database

If running PostgreSQL locally:

```sql
CREATE DATABASE arcadeos;
```

Or use your cloud provider's dashboard to create a database and grab the connection string.

### 5. Run all migrations

This applies all schema migrations in order (creates all tables):

```bash
npx prisma migrate deploy
```

> **Note:** Use `migrate deploy` (not `migrate dev`) for any non-development machine. `migrate dev` is for local development only and will ask interactive questions.

### 6. Generate Prisma Client

```bash
npm run db:generate
```

> This is usually automatic after migrations, but run it explicitly if you see Prisma Client import errors.

### 7. Seed the database

Seeds default roles, stations, inventory items, and discounts — and creates the initial user accounts:

```bash
npm run db:seed
```

This creates the following accounts:

| Email | Password | Role |
|---|---|---|
| `superadmin@arcadeos.local` | `superadmin1234` | Super Admin |
| `admin@arcadeos.local` | `admin1234` | Administrator |
| `reception@arcadeos.local` | `reception123` | Receptionist |

> ⚠️ **Change these passwords immediately after first login.**

### 8. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts Reference

| Script | What it does |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run start` | Start production server |
| `npm run build` | Build the Next.js production bundle |
| `npm run type-check` | Run TypeScript type checks |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:migrate` | Run `prisma migrate dev` (local dev only) |
| `npm run db:seed` | Seed the database with defaults |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:reset` | ⚠️ Drop and recreate the DB (dev only) |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_NAME` | Optional | App name shown in UI |
| `NEXT_PUBLIC_CURRENCY` | Optional | Currency code (default: `INR`) |
| `NEXT_PUBLIC_CURRENCY_SYMBOL` | Optional | Currency symbol (default: `₹`) |
| `PORT` | Optional | Port to listen on (default: `3000`) |
| `NODE_ENV` | Optional | `development` or `production` |

---

## Production Deployment

### 1. Build the Next.js bundle

```bash
npm run build
```

### 2. Apply migrations (never use `migrate dev` in production)

```bash
npx prisma migrate deploy
```

### 3. Start the server

```bash
npm run start
```

The app runs as a **single long-running Node.js process** — the custom `server.ts` handles both Next.js requests and Socket.IO WebSocket connections on the same port.

### Recommended: Run with a process manager

```bash
# Using PM2
npm install -g pm2
pm2 start "npm run start" --name arcadeos
pm2 save
```

---

## Project Structure

```
ArcadeOS/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Versioned SQL migrations
│   └── seed.ts                # Dev/initial data seeder
├── server.ts                  # Custom Node.js + Socket.IO entry point
├── src/
│   ├── app/                   # Next.js App Router (pages + API routes)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   │   ├── stations/
│   │   │   ├── sessions/
│   │   │   ├── billing/
│   │   │   ├── customers/
│   │   │   ├── inventory/
│   │   │   ├── reports/
│   │   │   └── settings/      # Users, Discounts, Audit Logs, Profile
│   │   └── api/               # REST API route handlers
│   ├── features/              # Feature-based modules
│   │   ├── auth/
│   │   ├── stations/
│   │   ├── sessions/
│   │   ├── billing/
│   │   ├── customers/
│   │   ├── food/
│   │   ├── reports/
│   │   ├── users/
│   │   ├── audit-logs/
│   │   └── parlour-profile/
│   ├── lib/                   # Shared utilities
│   │   ├── auth.ts            # JWT helpers
│   │   ├── permissions.ts     # RBAC permission guards
│   │   └── prisma.ts          # Prisma client singleton
│   └── middleware.ts          # Route protection middleware
└── .env.example               # Environment variable template
```

---

## Default Roles & Permissions

| Role | Key Permissions |
|---|---|
| **Super Admin** | Everything — full system access |
| **Administrator** | All features except user deletion and system settings |
| **Receptionist** | Dashboard, start/stop sessions, billing, basic customer lookup |

Roles and permissions are managed at **Settings → Users & Roles**.

---

## Migrations History

| Migration | Description |
|---|---|
| `20260804214607_001_initial` | Full initial schema |
| `20260804215223_002_add_unique_constraints` | Unique indexes on customers |
| `20260808210322_add_food_stock` | Food inventory stock tracking |
| `20260822072224_003_station_pricing` | Per-player-count station pricing |
| `20260824200306_rbac_foundation` | RBAC roles, Permission enum, user migration |
| `20260829132727_parlour_profile` | Singleton parlour profile table |
