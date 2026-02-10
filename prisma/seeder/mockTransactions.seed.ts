/**
 * Mock Transaction Data Seeder
 * Generates realistic POS transaction data for the current month
 *
 * Usage: bunx tsx prisma/seeder/mockTransactions.seed.ts
 */

import { PrismaClient } from "../../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Configuration - Generate data for current month
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

// Generate data from 3 months ago to current month
const startDate = new Date(currentYear, currentMonth - 3, 1); // 3 months ago
const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // End of current month

const CONFIG = {
  startDate,
  endDate,
  transactionsPerDay: { min: 15, max: 45 },
  itemsPerTransaction: { min: 1, max: 6 },
  cancelRate: 0.03, // 3% cancellation rate
  hoursOfOperation: { open: 8, close: 22 }, // 8 AM to 10 PM
};

// Indonesian names for cashiers - roleId will be fetched dynamically
const CASHIERS = [
  { username: "budi", name: "Budi Santoso" },
  { username: "siti", name: "Siti Rahayu" },
  { username: "ani", name: "Ani Wijaya" },
  { username: "deni", name: "Deni Pratama" },
];

// Cancellation reasons
const CANCEL_REASONS = [
  "Pelanggan berubah pikiran",
  "Salah input pesanan",
  "Stok barang tidak tersedia",
  "Pelanggan membatalkan pesanan",
  "Kesalahan harga",
  "Waktu tunggu terlalu lama",
];

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Get weighted random item (higher weight = more likely to be selected)
 */
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Generate random timestamp within a specific day
 */
function randomTimestamp(date: Date): Date {
  const { open, close } = CONFIG.hoursOfOperation;

  // Peak hours: 11-13 (lunch) and 18-20 (dinner)
  const hour = weightedRandom(
    Array.from({ length: close - open }, (_, i) => open + i),
    Array.from({ length: close - open }, (_, i) => {
      const h = open + i;
      // Higher weight during peak hours
      if ((h >= 11 && h <= 13) || (h >= 18 && h <= 20)) {
        return randomFloat(2, 4);
      }
      return 1;
    })
  );

  const minute = randomInt(0, 59);
  const second = randomInt(0, 59);

  const timestamp = new Date(date);
  timestamp.setHours(hour, minute, second, 0);
  return timestamp;
}

/**
 * Generate invoice number
 */
function generateInvoiceNo(date: Date, sequence: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(4, "0");
  return `INV-${year}${month}${day}-${seq}`;
}

/**
 * Main seeding function
 */
async function seedMockTransactions() {
  console.log("🌱 Starting mock transaction data seeding...");
  console.log(`📅 Period: ${CONFIG.startDate.toISOString().split("T")[0]} to ${CONFIG.endDate.toISOString().split("T")[0]}`);

  try {
    // Step 0: Clear existing mock data (transactions by mock cashiers)
    console.log("\n🗑️  Clearing existing mock data...");
    const cashierUsernames = CASHIERS.map(c => c.username);

    const existingCashiers = await prisma.user.findMany({
      where: { username: { in: cashierUsernames } },
      select: { id: true, username: true },
    });

    if (existingCashiers.length > 0) {
      const cashierIds = existingCashiers.map(c => c.id);

      // Get transactions to delete
      const transactionsToDelete = await prisma.transaction.findMany({
        where: { cashierId: { in: cashierIds } },
        select: { id: true },
      });

      const transactionIds = transactionsToDelete.map(t => t.id);

      // Delete transaction items (cascade will handle this, but being explicit)
      await prisma.transactionItem.deleteMany({
        where: { transactionId: { in: transactionIds } },
      });

      // Delete cancel logs
      await prisma.transactionCancelLog.deleteMany({
        where: { transactionId: { in: transactionIds } },
      });

      // Delete transactions
      await prisma.transaction.deleteMany({
        where: { cashierId: { in: cashierIds } },
      });

      console.log(`  ✓ Deleted ${transactionIds.length} existing mock transactions`);
    }

    // Step 1: Get or create KASIR role
    console.log("\n👤 Creating cashier users...");
    const kasirRole = await prisma.role.findUnique({
      where: { name: "KASIR" },
    });

    if (!kasirRole) {
      console.error("❌ KASIR role not found. Please seed roles first.");
      return;
    }

    console.log(`  ✓ Found KASIR role (ID: ${kasirRole.id})`);

    const createdCashiers: { id: string; name: string }[] = [];

    for (const cashier of CASHIERS) {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { username: cashier.username },
      });

      if (existing) {
        console.log(`  ✓ Cashier ${cashier.name} already exists`);
        createdCashiers.push({ id: existing.id, name: existing.name! });
      } else {
        const hashedPassword = await bcrypt.hash("123456", 10);
        const user = await prisma.user.create({
          data: {
            username: cashier.username,
            name: cashier.name,
            email: `${cashier.username}@pos.local`,
            password: hashedPassword,
            roleId: kasirRole.id,
            status: true,
          },
        });
        createdCashiers.push({ id: user.id, name: user.name! });
        console.log(`  ✓ Created cashier: ${cashier.name}`);
      }
    }

    // Step 2: Get existing products with stock
    console.log("\n📦 Fetching products...");
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { stock: true },
    });

    if (products.length === 0) {
      console.error("❌ No products found. Please seed products first.");
      return;
    }

    console.log(`  ✓ Found ${products.length} products`);

    // Create popularity weights (some items are more popular)
    const productWeights = products.map(() => {
      // 70% chance of normal popularity, 30% chance of being popular
      return Math.random() < 0.3 ? randomFloat(3, 5) : randomFloat(0.5, 2);
    });

    // Step 3: Generate transactions for each day
    console.log("\n💰 Generating transactions...");
    const startDate = new Date(CONFIG.startDate);
    const endDate = new Date(CONFIG.endDate);

    let totalTransactions = 0;
    let totalAmount = 0;
    let canceledCount = 0;

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();

      // Weekend (Saturday=6, Sunday=0) has more transactions
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseCount = isWeekend
        ? randomInt(CONFIG.transactionsPerDay.min + 10, CONFIG.transactionsPerDay.max + 15)
        : randomInt(CONFIG.transactionsPerDay.min, CONFIG.transactionsPerDay.max);

      // Lower transactions on Mondays (day 1)
      const transactionCount = dayOfWeek === 1
        ? Math.max(5, Math.floor(baseCount * 0.7))
        : baseCount;

      // Get highest invoice sequence for this day to avoid conflicts
      const datePrefix = generateInvoiceNo(date, 9999); // Get the prefix
      const prefix = datePrefix.substring(0, 13); // INV-YYYYMMDD-

      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          invoiceNo: { startsWith: prefix },
        },
        orderBy: { invoiceNo: "desc" },
        select: { invoiceNo: true },
      });

      let dailySequence = 1;
      if (existingTransaction) {
        const existingSeq = parseInt(existingTransaction.invoiceNo.split("-")[2], 10);
        dailySequence = existingSeq + 1;
      }

      let dailyTotal = 0;

      for (let i = 0; i < transactionCount; i++) {
        const createdAt = randomTimestamp(date);
        const cashier = createdCashiers[randomInt(0, createdCashiers.length - 1)];
        const invoiceNo = generateInvoiceNo(date, dailySequence++);

        // Generate transaction items
        const itemCount = randomInt(CONFIG.itemsPerTransaction.min, CONFIG.itemsPerTransaction.max);
        const selectedProducts: typeof products = [];
        const items: Array<{
          productId: number;
          productName: string;
          price: number;
          quantity: number;
          subtotal: number;
        }> = [];

        // Select products (avoid duplicates)
        const availableIndices = Array.from({ length: products.length }, (_, i) => i);
        for (let j = 0; j < Math.min(itemCount, availableIndices.length); j++) {
          const productIndex = weightedRandom(
            availableIndices,
            availableIndices.map((idx) => productWeights[idx])
          );
          const product = products[productIndex];
          selectedProducts.push(product);
          items.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: randomInt(1, 3),
            subtotal: 0, // Will be calculated
          });
          // Remove selected index to avoid duplicates
          const idxToRemove = availableIndices.indexOf(productIndex);
          availableIndices.splice(idxToRemove, 1);
        }

        // Calculate subtotals and total
        let transactionTotal = 0;
        for (const item of items) {
          item.subtotal = item.price * item.quantity;
          transactionTotal += item.subtotal;
        }

        // Determine if this transaction should be canceled
        const shouldCancel = Math.random() < CONFIG.cancelRate;
        const status: "COMPLETED" | "CANCELED" = shouldCancel ? "CANCELED" : "COMPLETED";

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            invoiceNo,
            totalAmount: transactionTotal,
            status,
            cashierId: cashier.id,
            createdAt,
            ...(shouldCancel && {
              canceledAt: new Date(createdAt.getTime() + randomInt(60000, 3600000)), // 1min to 1hour later
              canceledBy: createdCashiers[0].id, // Admin cancels
            }),
            items: {
              create: items,
            },
          },
        });

        totalTransactions++;
        totalAmount += transactionTotal;
        dailyTotal += transactionTotal;

        // Create cancel log if canceled
        if (shouldCancel) {
          const reason = CANCEL_REASONS[randomInt(0, CANCEL_REASONS.length - 1)];
          await prisma.transactionCancelLog.create({
            data: {
              transactionId: transaction.id,
              reason,
              canceledBy: createdCashiers[0].id,
              canceledAt: transaction.canceledAt!,
            },
          });
          canceledCount++;
        }
      }

      const formattedDate = date.toISOString().split("T")[0];
      console.log(`  📅 ${formattedDate}: ${transactionCount} transactions, Rp ${dailyTotal.toLocaleString("id-ID")}`);
    }

    // Step 4: Update stock quantities (subtract sold items)
    console.log("\n📊 Updating stock quantities...");

    // Get all transaction items
    const transactionItems = await prisma.transactionItem.findMany({
      where: {
        transaction: { status: "COMPLETED" },
      },
    });

    // Group by product and sum quantities
    const productSales = new Map<number, number>();
    for (const item of transactionItems) {
      const current = productSales.get(item.productId) || 0;
      productSales.set(item.productId, current + item.quantity);
    }

    // Update stock for each product
    for (const [productId, sold] of productSales.entries()) {
      const stock = await prisma.stock.findUnique({
        where: { productId },
      });

      if (stock) {
        const newQuantity = Math.max(5, stock.quantity - sold); // Keep minimum 5
        await prisma.stock.update({
          where: { productId },
          data: { quantity: newQuantity },
        });
      }
    }

    console.log(`  ✓ Updated stock for ${productSales.size} products`);

    // Summary
    console.log("\n✅ Seeding completed!");
    console.log("\n📈 Summary:");
    console.log(`  • Total transactions: ${totalTransactions}`);
    console.log(`  • Completed: ${totalTransactions - canceledCount}`);
    console.log(`  • Canceled: ${canceledCount} (${((canceledCount / totalTransactions) * 100).toFixed(1)}%)`);
    console.log(`  • Total revenue: Rp ${totalAmount.toLocaleString("id-ID")}`);
    console.log(`  • Average per transaction: Rp ${Math.round(totalAmount / totalTransactions).toLocaleString("id-ID")}`);
    console.log(`  • Average daily transactions: ${Math.round(totalTransactions / 31)}`);
    console.log(`  • Cashiers: ${createdCashiers.length}`);

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedMockTransactions().catch(console.error);
