import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { seedRolesAndPermissions } from "./seeder/rolePermissions.seed.js";
import { seedUsers } from "./seeder/users.seed.js";
import { seedProducts } from "./seeder/products.seed.js";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seed...");

  // Step 1: Seed roles and permissions
  const { superAdminRoleId } = await seedRolesAndPermissions(prisma);

  // Step 2: Seed users (depends on roles)
  await seedUsers(prisma, superAdminRoleId);

  // Step 3: Seed products
  await seedProducts(prisma);

  console.log("\n✓ Database seed completed successfully!");
  console.log("\n========================================");
  console.log("Super Admin Credentials:");
  console.log("Email: admin@example.com");
  console.log("Password: 123456");
  console.log("\n----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
