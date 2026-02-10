#!/usr/bin/env bun
/**
 * Delete transactions from Feb 11, 2026 onwards
 */

import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:devonly@localhost:5432/postgres?schema=public",
});

const prisma = new PrismaClient({ adapter });

const cutoffDate = new Date("2026-02-11T00:00:00Z");

console.log(`Deleting transactions from ${cutoffDate.toISOString()}...`);

try {
  const count = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: cutoffDate,
      },
    },
  });

  console.log(`Found ${count} transactions to delete.`);

  if (count > 0) {
    const deletedItems = await prisma.transactionItem.deleteMany({
      where: {
        transaction: {
          createdAt: { gte: cutoffDate },
        },
      },
    });
    console.log(`Deleted ${deletedItems.count} transaction items.`);

    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        transaction: {
          createdAt: { gte: cutoffDate },
        },
      },
    });
    console.log(`Deleted ${deletedPayments.count} payment records.`);

    const deletedLogs = await prisma.transactionCancelLog.deleteMany({
      where: {
        transaction: {
          createdAt: { gte: cutoffDate },
        },
      },
    });
    console.log(`Deleted ${deletedLogs.count} cancel logs.`);

    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        createdAt: { gte: cutoffDate },
      },
    });
    console.log(`Deleted ${deletedTransactions.count} transactions.`);

    console.log("Done!");
  }
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
