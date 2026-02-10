# Next.js Starter Kit

A production-ready Next.js 16 starter kit with comprehensive authentication, role-based access control (RBAC), and modern tools.

## Tech Stack

- **Next.js 16** - App Router with Server Components & Turbopack
- **React 19** - Latest React with modern features
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Prisma** - Type-safe ORM with PostgreSQL
- **NextAuth v5 (Auth.js)** - Authentication with JWT strategy
- **Tanstack Query v5** - Server state management
- **React Hook Form** - Form management with validation
- **Zod v4** - Schema validation
- **Axios** - HTTP client with interceptors
- **Zustand** - Lightweight state management
- **Lucide React** - Modern icon library
- **next-themes** - Dark mode support
- **Sonner** - Toast notifications

## Features

- ✅ Modern Next.js 16 with App Router and Turbopack
- ✅ TypeScript for type safety
- ✅ Authentication with JWT (no database sessions)
- ✅ **Role-Based Access Control (RBAC)** with permissions system
- ✅ **User Management** - CRUD operations for users with roles
- ✅ **Permission Management** - Hierarchical permissions with modules
- ✅ **Role Management** - Dynamic role assignment with permissions
- ✅ Prisma ORM with PostgreSQL
- ✅ Pre-configured Axios with interceptors
- ✅ Form validation with Zod v4
- ✅ Beautiful UI components with shadcn/ui
- ✅ Server state management with Tanstack Query
- ✅ Custom hooks for permissions and sidebar
- ✅ Dark mode support with next-themes
- ✅ Toast notifications with Sonner
- ✅ ESLint configured
- ✅ Dashboard layout with sidebar navigation

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd next-starter-kit
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

Edit `.env` and update the following:
- `DATABASE_URL`: Your PostgreSQL connection string
- `AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `PM2_PORT`: (Optional) Port for PM2 process manager

4. Setup database:
```bash
# Generate Prisma Client
npx prisma generate

# Create and run migration (development)
npx prisma migrate dev --name init

# (Optional) Seed database with dummy data
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── (dashboard)/            # Dashboard route group
│   │   ├── dashboard/          # Dashboard page
│   │   ├── users/              # User management pages
│   │   └── layout.tsx          # Dashboard layout with sidebar
│   ├── api/                    # API routes
│   │   ├── auth/               # NextAuth API routes
│   │   ├── permissions/        # Permissions API
│   │   ├── roles/              # Roles API
│   │   └── users/              # Users API
│   ├── login/                  # Login page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                  # React components
│   ├── auth/                   # Authentication components
│   ├── import/                 # Import-related components
│   ├── layout/                 # Layout components (Header, Sidebar, etc.)
│   ├── scm-ui/                 # Custom SCM UI components
│   └── ui/                     # shadcn/ui components
├── hooks/                       # Custom React hooks
│   ├── use-permission.ts       # Permission hook
│   └── use-sidebar.ts          # Sidebar state hook
├── lib/                         # Utility functions
│   ├── api.ts                  # API client functions
│   ├── auth.ts                 # Auth configuration (NextAuth)
│   ├── axios.ts                # Axios instance with interceptors
│   ├── icons.ts                # Icon utilities
│   ├── permissions.ts          # Permission utilities
│   ├── prisma.ts               # Prisma client
│   ├── utils.ts                # General utilities
│   ├── utils/                  # Additional utility modules
│   └── validations/            # Zod validation schemas
│       ├── auth.ts             # Auth validation schemas
│       └── common.ts           # Common validation schemas
├── providers/                   # React Context providers
│   ├── permission-provider.tsx # Permission context
│   ├── query-provider.tsx      # TanStack Query provider
│   └── theme-provider.tsx      # Theme provider (dark mode)
├── stories/                     # Storybook stories (if applicable)
├── types/                       # TypeScript type definitions
├── utils/                       # Additional utilities
└── proxy.ts                     # Proxy configuration

prisma/
├── schema.prisma               # Database schema
├── migrations/                 # Database migrations
└── dummy/                      # Seed data (currently empty)
```

## Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database (Prisma)
- `npx prisma generate` - Generate Prisma Client
- `npx prisma migrate dev` - Create and apply migration (development)
- `npx prisma migrate deploy` - Apply migrations (production)
- `npx prisma migrate reset` - Reset database and reapply all migrations
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Run seed script (defined in package.json)

## Authentication & Authorization

### NextAuth v5 (Auth.js)

This starter uses NextAuth v5 with:
- **JWT strategy** (no database sessions)
- **Credentials provider** for username/password authentication
- Passwords hashed with bcryptjs
- Session data includes user info and role

### Usage Example

```typescript
import { auth, signIn, signOut } from "@/lib/auth"

// Get current session (server component)
const session = await auth()
// session.user contains: id, name, username, email, image, roleId

// Sign in
await signIn("credentials", {
  username: "admin",
  password: "password"
})

// Sign out
await signOut()
```

### Role-Based Access Control (RBAC)

The project includes a comprehensive RBAC system:

#### Database Models
- **User** - Users with assigned roles
- **Role** - Roles with permissions (e.g., Admin, Manager, User)
- **Permission** - Hierarchical permissions with modules and sections
- **RolePermission** - Junction table linking roles to permissions

#### Permission Features
- Hierarchical structure (parent-child relationships)
- Module-based organization
- Sidebar visibility control
- Section support for UI organization
- Sequence ordering for display
- Active/inactive status

#### Using Permissions

```typescript
// In components
import { usePermission } from "@/hooks/use-permission"

const { hasPermission, permissions } = usePermission()

// Check single permission
if (hasPermission("users.create")) {
  // Show create button
}

// Get user's permissions
console.log(permissions) // Array of permission codes
```

#### Permission Provider

The app is wrapped with `PermissionProvider` that fetches and caches user permissions:

```typescript
// Already configured in src/app/layout.tsx
<PermissionProvider>
  {children}
</PermissionProvider>
```

## API Client

Pre-configured Axios instance with automatic token handling and error interceptors:

```typescript
import { axiosInstance } from "@/lib/axios"

// Axios automatically includes auth token from session
const response = await axiosInstance.get("/api/users")
const user = await axiosInstance.post("/api/users", {
  username: "john",
  name: "John Doe",
  roleId: 1
})
```

Features:
- Automatic JWT token injection from NextAuth session
- Error handling interceptors
- Response interceptors for consistent data format
- Base URL configuration

## Forms with Validation

Using React Hook Form + Zod v4 for type-safe form validation:

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema } from "@/lib/validations/auth"

const form = useForm({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    username: "",
    password: ""
  }
})

// Available validation schemas in src/lib/validations/:
// - auth.ts: loginSchema, registerSchema
// - common.ts: Common validation patterns
```

### shadcn/ui Form Components

```typescript
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

## Database

### Prisma Schema

The database schema (`prisma/schema.prisma`) includes:

#### Core Models
- **User** - User accounts with authentication
  - Fields: id, username, name, email, password, roleId, status, deletedAt
  - Soft delete support via `deletedAt`
  - Indexed for performance

- **Role** - User roles for RBAC
  - Fields: id, name, description, byPassAllFeatures, isActive
  - `byPassAllFeatures`: Grants all permissions without explicit assignment

- **Permission** - Hierarchical permissions
  - Fields: code, label, href, icon, module, isSection, sequence, parentId
  - Support for nested permissions (parent-child)
  - Sidebar navigation control

- **RolePermission** - Links roles to permissions
  - Many-to-many relationship
  - Unique constraint on (roleId, permissionId)

### Working with Prisma

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration (development)
npx prisma migrate dev --name your_migration_name

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with dummy data
npm run db:seed
```

**Migration Workflow:**

1. **Development**: After modifying `schema.prisma`, run `npx prisma migrate dev --name descriptive_name`
   - Creates a new migration file
   - Applies migration to your database
   - Regenerates Prisma Client

2. **Production**: Deploy migrations with `npx prisma migrate deploy`
   - Applies all pending migrations
   - Does not create new migrations
   - Safe for CI/CD pipelines

### Using Prisma Client

```typescript
import { prisma } from "@/lib/prisma"

// Query users with role
const users = await prisma.user.findMany({
  where: { status: true, deletedAt: null },
  include: { role: true }
})

// Create user
const user = await prisma.user.create({
  data: {
    username: "john",
    name: "John Doe",
    email: "john@example.com",
    password: hashedPassword,
    roleId: 1
  }
})
```

## State Management

### TanStack Query (React Query)

Server state management with automatic caching and revalidation:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { axiosInstance } from "@/lib/axios"

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: async () => {
    const response = await axiosInstance.get("/api/users")
    return response.data
  }
})

// Mutate data
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: (newUser) => axiosInstance.post("/api/users", newUser),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] })
  }
})
```

### Zustand

Lightweight client state management:

```typescript
import { create } from "zustand"

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))

// In component
const { count, increment } = useStore()
```

## Custom Hooks

### usePermission
Check user permissions and bypass admin roles:

```typescript
const { hasPermission, permissions, role } = usePermission()
```

### useSidebar
Manage sidebar state (open/close):

```typescript
const { isOpen, toggle, setIsOpen } = useSidebar()
```

## UI Components

The project includes 25+ shadcn/ui components:
- Forms: Input, Textarea, Select, Checkbox, Switch, DatePicker
- Layout: Card, Separator, ScrollArea, Sheet, Dialog
- Feedback: Alert Dialog, Sonner (Toast), Progress, Skeleton
- Navigation: Dropdown Menu, Command, Breadcrumb
- Data: Table, Avatar, Badge
- And more...

All components are customizable via Tailwind CSS and support dark mode.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
4. Deploy

### Other Platforms

1. Build the project: `npm run build`
2. Start the server: `npm start`
3. Ensure environment variables are set:
   - `DATABASE_URL`: PostgreSQL connection string
   - `AUTH_SECRET`: Secret for JWT signing
   - `PM2_PORT`: (Optional) Custom port

### Database Migrations

For production deployments, always use `prisma migrate deploy`:

```bash
# Apply all pending migrations (production)
npx prisma migrate deploy
```

**Important Notes:**
- Never use `prisma migrate dev` in production
- Always commit migration files to version control
- Run `prisma migrate deploy` as part of your deployment pipeline
- Generate Prisma Client after migrations: `npx prisma generate`

## Architecture Highlights

### API Route Pattern
All API routes follow a consistent pattern:
- `route.ts` - Main route handler with HTTP method exports
- Separate handler files for business logic
- Error handling with try-catch
- Response standardization

### Authentication Flow
1. User submits credentials to `/api/auth/callback/credentials`
2. NextAuth validates via `authorize()` function
3. JWT token generated with user data
4. Token stored in session cookie
5. Axios interceptor adds token to API requests

### Permission System
1. User logs in and role is stored in session
2. `PermissionProvider` fetches permissions for user's role
3. Permissions cached in React Context
4. Components use `usePermission()` hook for access control
5. API routes verify permissions server-side

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT
