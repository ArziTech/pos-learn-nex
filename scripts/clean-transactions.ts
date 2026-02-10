#!/usr/bin/env bun
/**
 * Delete transactions created after a specific date
 * Usage: bun scripts/clean-transactions.ts
 */

import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:devonly@localhost:5432/postgres?schema=public",
});

const prisma = new PrismaClient({ adapter });

const cutoffDate = new Date("2025-02-10T14:09:00Z");

console.log(`Deleting transactions created after ${cutoffDate.toISOString()}...`);

try {
  // First, get the count
  const count = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: cutoffDate,
      },
    },
  });

  console.log(`Found ${count} transactions to delete.`);

  if (count > 0) {
    // Delete related records first (cascade won't work because we don't have foreign key constraints set up with cascade)
    // Delete transaction items
    const deletedItems = await prisma.transactionItem.deleteMany({
      where: {
        transaction: {
          createdAt: {
            gte: cutoffDate,
          },
        },
      },
    });
    console.log(`Deleted ${deletedItems.count} transaction items.`);

    // Delete payments
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        transaction: {
          createdAt: {
            gte: cutoffDate,
          },
        },
      },
    });
    console.log(`Deleted ${deletedPayments.count} payment records.`);

    // Delete cancel logs
    const deletedLogs = await prisma.transactionCancelLog.deleteMany({
      where: {
        transaction: {
          createdAt: {
            gte: cutoffDate,
          },
        },
      },
    });
    console.log(`Deleted ${deletedLogs.count} cancel logs.`);

    // Finally delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        createdAt: {
          gte: cutoffDate,
        },
      },
    });
    console.log(`Deleted ${deletedTransactions.count} transactions.`);

    console.log("Cleanup completed successfully!");
  } else {
    console.log("No transactions found to delete.");
  }
} catch (error) {
  console.error("Error during cleanup:", error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
