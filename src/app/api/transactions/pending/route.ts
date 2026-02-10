import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/transactions/pending
 * Create a pending transaction for Midtrans payment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, totalAmount, paymentMethod = "MIDTRANS_QRIS", customerDetails } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items", details: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: "Invalid item", details: "Each item must have productId, quantity, and price" },
          { status: 400 }
        );
      }
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid quantity", details: "Quantity must be greater than 0" },
          { status: 400 }
        );
      }
    }

    // Verify products exist and have enough stock
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: { stock: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Some products are not available" },
        { status: 400 }
      );
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product?.stock || product.stock.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: "Insufficient stock",
            details: `Product ${product?.name} does not have enough stock`,
          },
          { status: 400 }
        );
      }
    }

    // Generate invoice number
    const invoiceNo = await generateInvoiceNumber();

    // Create pending transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction with PENDING status
      const transaction = await tx.transaction.create({
        data: {
          invoiceNo,
          totalAmount,
          status: "PENDING", // PENDING until payment is confirmed
          paymentType: paymentMethod,
          paymentStatus: "PENDING",
          cashierId: session.user.id,
        },
      });

      // Create transaction items and update stock
      for (const item of items) {
        // Create transaction item
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            productName: products.find((p) => p.id === item.productId)?.name || "",
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          },
        });

        // Update stock
        await tx.stock.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return transaction;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        invoiceNo: result.invoiceNo,
        totalAmount: result.totalAmount,
        status: result.status,
        paymentStatus: result.paymentStatus,
        createdAt: result.createdAt,
        customerDetails: {
          name: session.user.name || "Customer",
          email: (session.user as any).email || "customer@example.com",
        },
      },
    });
  } catch (error: any) {
    console.error("Error creating pending transaction:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate unique invoice number
 * Format: INV-{YYYYMMDD}-{seq}
 */
async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  // Get the count of transactions today
  const count = await prisma.transaction.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `INV-${dateStr}-${seq}`;
}
