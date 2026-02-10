# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

POS (Point of Sale) system built with Next.js 16, Prisma, and PostgreSQL. Features include product management, cashier/checkout, transaction history, and business analytics/reports with role-based access control.

## Commands

### Development
```bash
bun run dev          # Start development server
bun run build        # Production build
bun run start        # Start production server
bun run lint         # Run ESLint
```

### Database
```bash
bun prisma migrate dev    # Create and apply migrations
bun prisma migrate dev --name X  # Named migration
bun prisma migrate prod   # Apply migrations in production
bun prisma studio         # Open Prisma Studio
bun prisma seed           # Seed database (tsx runs seed.ts)
```

Default seeded credentials:
- Username: `admin` / Email: `admin@example.com`
- Password: `123456`

## Architecture

### Custom Prisma Client Output

**Critical**: Prisma client is generated to a custom path (`src/generated/prisma`) instead of `node_modules/.prisma/client`. All imports must use:

```typescript
import { PrismaClient } from "@/generated/prisma/client";
// OR for seed files (ESM):
import { PrismaClient } from "../src/generated/prisma/client.js";
```

### Prisma Adapter for PostgreSQL

This project uses `@prisma/adapter-pg` (pooler-friendly adapter) instead of the default Prisma PostgreSQL driver. Always instantiate PrismaClient with the adapter:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
```

### Seed Files Must Be ESM

When editing seed files in `prisma/seeder/`, use `.js` extensions for internal imports since `tsx` runs them as ESM:

```typescript
import { seedRolesAndPermissions } from "./seeder/rolePermissions.seed.js";
```

### Authentication & Authorization

- **NextAuth.js v5** with credentials provider and JWT strategy (no database sessions)
- **Role-Based Access Control (RBAC)**: Users have Roles, Roles have Permissions via `RolePermission` junction
- **Permission hierarchy**: Permissions can have `parentId` for nested sidebar navigation
- **Sidebar rendering**: Based on `Permission.showOnSidebar` and user's role permissions
- Default roles: `SUPER_ADMIN`, `KASIR` (Cashier), `MANAGER`

### Timezone Handling (Indonesia WIB = UTC+7)

Database stores timestamps in UTC. All date range queries must convert local dates to UTC:

```typescript
// Convert local date to UTC date range
function getDayRangeInUTC(localDate: Date): { start: Date; end: Date } {
  const startLocal = new Date(localDate);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = new Date(localDate);
  endLocal.setHours(23, 59, 59, 999);

  // Create ISO strings and parse to get proper UTC dates
  const startUTC = new Date(startLocal.toISOString());
  const endUTC = new Date(endLocal.toISOString());

  return { start: startUTC, end: endUTC };
}
```

For displaying dates from UTC in local timezone:
```typescript
function utcToLocalDateString(utcDate: Date): string {
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### API Response Pattern

API routes follow consistent response structure:
```typescript
return NextResponse.json({
  success: true,
  data: { ... },
});
```

### Client-Side Data Fetching

Uses `@tanstack/react-query` with axios instance (`src/lib/axios.ts`). The axios interceptor handles 401 redirects to login.

### Layout Structure

- `src/app/layout.tsx` - Root layout with providers
- `src/app/(dashboard)/layout.tsx` - Dashboard layout with Sidebar, Header, Footer, MobileNav
- All dashboard routes are under `(dashboard)` route group

### Component Organization

- `src/components/ui/` - shadcn/ui components (Radix UI primitives + Tailwind)
- `src/components/layout/` - Layout components (Sidebar, Header, Footer)
- Page-specific components are in `_components/` subdirectories (e.g., `src/app/(dashboard)/cashier/_components/`)

### Transaction Invoice Numbers

Generated format: `INV-YYYYMMDD-SEQUENCE` (e.g., `INV-20260210-0001`)

### Soft Delete Pattern

Users use soft delete via `deletedAt` timestamp. Products use `isActive` boolean.
