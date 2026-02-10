# POS System

A comprehensive Point of Sale system built with Next.js 16, featuring payment integration, inventory management, transaction tracking, and role-based access control.

## Features

- **Cashier/POS** - Fast checkout with product search and cart management
- **Payment Integration** - Midtrans gateway supporting QRIS, e-wallets, bank transfers, and cash
- **Product Management** - Full CRUD for products with categories and stock tracking
- **Transaction History** - Complete transaction records with cancellation support
- **Business Analytics** - Sales reports with date range filtering
- **User Management** - Role-based access control (RBAC) with granular permissions
- **Profile Management** - Users can update their profile and change password

## Tech Stack

- **Next.js 16** - App Router with Turbopack
- **React 19** - Latest React features
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Prisma** - Type-safe ORM with PostgreSQL
- **NextAuth v5** - Authentication with JWT
- **TanStack Query** - Server state management
- **Midtrans** - Payment gateway integration
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Bun (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd pos-learn-next
```

2. Install dependencies:
```bash
bun install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/pos_db"
AUTH_SECRET="$(openssl rand -base64 32)"

# Midtrans Payment (get from https://dashboard.midtrans.com)
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Setup database:
```bash
# Generate Prisma Client
bun prisma generate

# Run migrations
bun prisma migrate dev

# Seed database (products, users, permissions)
bun prisma seed
```

5. Run development server:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Credentials

After seeding, login with:
- **Username:** `admin`
- **Email:** `admin@example.com`
- **Password:** `123456`

## Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint

bun prisma generate  # Generate Prisma Client
bun prisma migrate dev # Create & apply migration
bun prisma studio    # Open Prisma Studio
bun prisma seed      # Seed database
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/           # Dashboard route group
│   │   ├── cashier/          # POS/Cashier page
│   │   ├── dashboard/        # Dashboard home
│   │   ├── products/         # Product management
│   │   ├── transactions/     # Transaction history
│   │   ├── reports/          # Sales reports
│   │   ├── users/            # User management
│   │   ├── roles/            # Role management
│   │   └── profile/          # User profile
│   ├── api/
│   │   ├── auth/             # NextAuth routes
│   │   ├── products/         # Products API
│   │   ├── transactions/     # Transactions API
│   │   ├── payment/          # Midtrans payment API
│   │   ├── reports/          # Reports API
│   │   ├── users/            # Users API
│   │   ├── roles/            # Roles API
│   │   └── permissions/      # Permissions API
│   └── layout.tsx            # Root layout
├── components/
│   ├── layout/               # Header, Sidebar, Footer
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── prisma.ts             # Prisma client
│   ├── midtrans.ts           # Midtrans integration
│   └── axios.ts              # HTTP client
├── hooks/
│   ├── use-permission.ts     # Permission hook
│   └── use-sidebar.ts        # Sidebar state
└── providers/
    ├── permission-provider.tsx
    ├── query-provider.tsx
    └── theme-provider.tsx

prisma/
├── schema.prisma             # Database schema
├── migrations/               # Database migrations
└── seeder/                   # Seed scripts
```

## Database Schema

### Core Models

**User** - User accounts
- Fields: id, username, name, email, password, roleId, status
- Soft delete via `deletedAt`

**Role** - User roles (SUPER_ADMIN, KASIR, MANAGER)
- `byPassAllFeatures` grants all permissions

**Permission** - Granular permissions
- Hierarchical (parent-child relationships)
- Sidebar navigation control

**Product** - Product catalog
- Linked to Category and Stock

**Stock** - Inventory tracking
- One-to-one with Product

**Transaction** - Sales transactions
- Status: PENDING, COMPLETED, CANCELED
- Payment tracking with Midtrans integration

**Payment** - Payment records
- Midtrans transaction details

### Transaction Flow

1. Cashier adds products to cart
2. Selects payment method (Cash / QRIS / E-Wallet / Bank Transfer)
3. For cash: Transaction created as COMPLETED
4. For Midtrans:
   - Transaction created as PENDING
   - Payment initiated via Midtrans Snap
   - Webhook updates transaction status

## Payment Integration (Midtrans)

### Supported Methods

- **Cash** - Direct payment, instant completion
- **QRIS** - Scan QR with GoPay, OVO, Dana, etc.
- **E-Wallet** - GoPay, ShopeePay, OVO, Dana, LinkAja
- **Bank Transfer** - BCA, Mandiri, BNI, BRI, etc.

### Configuration

1. Get credentials from [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Add to `.env`:
   ```bash
   MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxx"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"
   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxx"
   ```
3. Set webhook URL: `https://yourdomain.com/api/payment/webhook`

### API Endpoints

- `POST /api/payment/create` - Create payment transaction
- `GET /api/payment/status/[orderId]` - Check payment status
- `POST /api/payment/webhook` - Midtrans notification handler

## Role-Based Access Control

### Default Roles

- **SUPER_ADMIN** - Full access, bypasses all permission checks
- **KASIR** (Cashier) - POS access, transaction management
- **MANAGER** - Reports, analytics, user management

### Permission Check

```typescript
import { usePermission } from "@/hooks/use-permission"

const { hasPermission } = usePermission()

if (hasPermission("cashier")) {
  // Show cashier feature
}
```

## Development Notes

### Custom Prisma Client Output

Prisma client is generated to `src/generated/prisma` instead of `node_modules`:
```typescript
import { PrismaClient } from "@/generated/prisma/client";
```

### PostgreSQL Adapter

Uses `@prisma/adapter-pg` for better connection pooling:
```typescript
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

### Timezone Handling

Database stores UTC. For date range queries (WIB = UTC+7):
```typescript
function getDayRangeInUTC(localDate: Date): { start: Date; end: Date } {
  const startLocal = new Date(localDate);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = new Date(localDate);
  endLocal.setHours(23, 59, 59, 999);
  return {
    start: new Date(startLocal.toISOString()),
    end: new Date(endLocal.toISOString()),
  };
}
```

## License

MIT
