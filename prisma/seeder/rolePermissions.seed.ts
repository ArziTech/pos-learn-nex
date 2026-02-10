import { PrismaClient } from "../../src/generated/prisma/client.js";

// ========================================
// Type Definitions
// ========================================

interface RoleDefinition {
  name: string;
  description: string;
  byPassAllFeatures: boolean;
  isActive: boolean;
}

interface PermissionDefinition {
  code: string;
  label: string;
  description: string;
  module: string;
  isSection: boolean;
  sequence: number;
  showOnSidebar: boolean;
  isActive: boolean;
  href?: string | null;
  icon?: string | null;
  parentCode?: string | null;
}

interface RolePermissionMapping {
  roleName: string;
  permissionCodes: string[];
}

// ========================================
// Data Definitions
// ========================================

const roleDefinitions: RoleDefinition[] = [
  {
    name: "SUPERADMIN",
    description: "Super Administrator dengan akses penuh sistem",
    byPassAllFeatures: true,
    isActive: true,
  },
  {
    name: "KASIR",
    description: "Kasir untuk transaksi penjualan",
    byPassAllFeatures: false,
    isActive: true,
  },
  {
    name: "MANAGER",
    description: "Manager untuk mengelola operasional",
    byPassAllFeatures: false,
    isActive: true,
  },
];
const permissionDefinitions: PermissionDefinition[] = [
  // Dashboard
  {
    code: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    description: "Access to main dashboard",
    icon: "LayoutDashboard",
    module: "dashboard",
    isSection: false,
    sequence: 1,
    showOnSidebar: true,
    isActive: true,
    parentCode: null,
  },
  // POS Section
  {
    code: "pos",
    label: "POS",
    href: null,
    description: "Point of Sale Section",
    module: "pos",
    isSection: true,
    sequence: 4,
    showOnSidebar: true,
    isActive: true,
    icon: "CashRegister",
    parentCode: null,
  },
  // Cashier
  {
    code: "cashier",
    label: "Kasir",
    href: "/cashier",
    description: "Access to cashier page",
    icon: "Banknote",
    module: "pos",
    isSection: false,
    sequence: 5,
    showOnSidebar: true,
    isActive: true,
    parentCode: null,
  },
  // Products
  {
    code: "product",
    label: "Produk",
    href: "/products",
    description: "Access to product management page",
    icon: "Package",
    module: "pos",
    isSection: false,
    sequence: 6,
    showOnSidebar: true,
    isActive: true,
    parentCode: null,
  },
  // Transactions
  {
    code: "transaction",
    label: "Transaksi",
    href: "/transactions",
    description: "Access to transaction history page",
    icon: "Receipt",
    module: "pos",
    isSection: false,
    sequence: 7,
    showOnSidebar: true,
    isActive: true,
    parentCode: null,
  },
  // Reports Section
  {
    code: "report",
    label: "Laporan",
    href: null,
    description: "Reports and Analytics Section",
    module: "report",
    isSection: false,
    sequence: 8,
    showOnSidebar: true,
    isActive: true,
    icon: "BarChart3",
    parentCode: null,
  },
  // Reports
  {
    code: "reports",
    label: "Analitik",
    href: "/reports",
    description: "Access to reports and analytics page",
    icon: "TrendingUp",
    module: "report",
    isSection: false,
    sequence: 9,
    showOnSidebar: true,
    isActive: true,
    parentCode: "report",
  },
  // Master Section
  {
    code: "master",
    label: "Master",
    href: null,
    description: "Master Section",
    module: "master",
    isSection: true,
    sequence: 2,
    showOnSidebar: true,
    isActive: true,
    icon: "UserCircle",
    parentCode: null,
  },
  // User Management - Menu
  {
    code: "user",
    label: "User",
    href: "/users",
    description: "Access to user management page",
    module: "master",
    isSection: false,
    sequence: 3,
    showOnSidebar: true,
    isActive: true,
    icon: "UsersCircle",
    parentCode: null,
  },
  // Role Management - Menu
  {
    code: "role",
    label: "Role & Permission",
    href: "/roles",
    description: "Access to role and permission management page",
    module: "master",
    isSection: false,
    sequence: 4,
    showOnSidebar: true,
    isActive: true,
    icon: "Shield",
    parentCode: null,
  },
];

const rolePermissionMappings: RolePermissionMapping[] = [
  {
    roleName: "SUPERADMIN",
    permissionCodes: ["dashboard", "master", "user", "role", "pos", "cashier", "product", "transaction", "report", "reports"],
  },
  {
    roleName: "KASIR",
    permissionCodes: ["dashboard", "cashier"],
  },
  {
    roleName: "MANAGER",
    permissionCodes: ["dashboard", "pos", "cashier", "product", "transaction", "report", "reports"],
  },
];

// ========================================
// Helper Functions
// ========================================

async function createOrUpdatePermission(
  prisma: PrismaClient,
  permDef: PermissionDefinition,
  parentId: number | null
) {
  return await prisma.permission.upsert({
    where: { code: permDef.code },
    update: {
      label: permDef.label,
      description: permDef.description,
      icon: permDef.icon,
      module: permDef.module,
      isSection: permDef.isSection,
      sequence: permDef.sequence,
      showOnSidebar: permDef.showOnSidebar,
      isActive: permDef.isActive,
      href: permDef.href,
      parentId: parentId,
    },
    create: {
      code: permDef.code,
      label: permDef.label,
      description: permDef.description,
      icon: permDef.icon,
      module: permDef.module,
      isSection: permDef.isSection,
      sequence: permDef.sequence,
      showOnSidebar: permDef.showOnSidebar,
      isActive: permDef.isActive,
      href: permDef.href,
      parentId: parentId,
    },
  });
}

// ========================================
// Main Seeder Function
// ========================================

export async function seedRolesAndPermissions(prisma: PrismaClient) {
  // Step 1: Create Roles
  console.log("Creating roles...");
  const createdRoles = new Map<string, any>();

  for (const roleDef of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        byPassAllFeatures: roleDef.byPassAllFeatures,
        isActive: roleDef.isActive,
        description: roleDef.description,
      },
      create: roleDef,
    });

    createdRoles.set(role.name, role);
    console.log(`✓ Created/Updated role: ${role.name} (ID: ${role.id})`);
  }

  // Step 2: Create Permissions (Two-Pass for parent-child relationships)
  console.log("\nCreating permissions...");
  const createdPermissions = new Map<string, any>();

  // Pass 1: Create parent permissions
  const parentPermissions = permissionDefinitions.filter(
    (p) => p.parentCode === null
  );
  for (const permDef of parentPermissions) {
    const permission = await createOrUpdatePermission(prisma, permDef, null);
    createdPermissions.set(permission.code, permission);
    console.log(
      `✓ Created/Updated permission: ${permission.code} (ID: ${permission.id})`
    );
  }

  // Pass 2: Create child permissions
  const childPermissions = permissionDefinitions.filter(
    (p) => p.parentCode !== null
  );
  for (const permDef of childPermissions) {
    const parentPermission = createdPermissions.get(permDef.parentCode!);
    const permission = await createOrUpdatePermission(
      prisma,
      permDef,
      parentPermission?.id
    );
    createdPermissions.set(permission.code, permission);
    console.log(
      `✓ Created/Updated permission: ${permission.code} (ID: ${permission.id})`
    );
  }

  // Step 3: Assign Permissions to Roles (Batch)
  console.log("\nAssigning permissions to roles...");

  for (const mapping of rolePermissionMappings) {
    const role = createdRoles.get(mapping.roleName);
    if (!role) {
      console.warn(`⚠ Role ${mapping.roleName} not found, skipping...`);
      continue;
    }

    const permissionIds = mapping.permissionCodes
      .map((code) => createdPermissions.get(code)?.id)
      .filter((id) => id !== undefined);

    if (permissionIds.length === 0) {
      console.warn(`⚠ No permissions found for role ${mapping.roleName}`);
      continue;
    }

    // Batch create role-permission assignments
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId: permissionId!,
        createdBy: "system",
      })),
      skipDuplicates: true,
    });

    console.log(
      `✓ Assigned ${permissionIds.length} permissions to ${role.name}`
    );
  }

  // Return role IDs for use in other seeders
  return {
    superAdminRoleId: createdRoles.get("SUPERADMIN")?.id,
  };
}
