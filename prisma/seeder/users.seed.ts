import { PrismaClient } from "../../src/generated/prisma/client.js";
import * as bcrypt from "bcryptjs";

export async function seedUsers(
  prisma: PrismaClient,
  superAdminRoleId: number
) {
  console.log("\nCreating super admin user...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      username: "superadmin",
      password: hashedPassword,
      roleId: superAdminRoleId,
      name: "Super Admin",
      status: true,
      emailVerified: new Date(),
    },
    create: {
      username: "superadmin",
      email: "admin@example.com",
      password: hashedPassword,
      roleId: superAdminRoleId,
      name: "Super Admin",
      status: true,
      emailVerified: new Date(),
    },
  });

  console.log(
    `✓ Created/Updated super admin user: ${superAdminUser.email} (ID: ${superAdminUser.id})`
  );

  return superAdminUser;
}
