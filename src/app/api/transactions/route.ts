import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, totalAmount, discount } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items", details: "Items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity) {
        return NextResponse.json(
          { error: "Invalid item", details: "Each item must have productId and quantity" },
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

    // Create transaction with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction - PENDING for non-cash, COMPLETED for cash
      const transaction = await tx.transaction.create({
        data: {
          invoiceNo,
          totalAmount,
          status: "COMPLETED", // For cash payment, complete immediately
          paymentType: "CASH",
          paymentStatus: "PAID",
          paidAt: new Date(),
          cashierId: session.user.id,
          // Discount fields
          discountAmount: discount?.amount || 0,
          discountType: discount?.type || null,
          discountValue: discount?.value || null,
        },
      });

      // Create payment record for cash transaction
      await tx.payment.create({
        data: {
          transactionId: transaction.id,
          amount: totalAmount,
          paymentType: "CASH",
          paymentMethod: "cash",
          paymentStatus: "settlement",
          transactionTime: new Date(),
        },
      });

      // Create transaction items and update stock
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        const discountedPrice = item.discountedPrice || item.price || product?.price || 0;
        const discountAmount = item.discountAmount || 0;

        // Create transaction item
        await tx.transactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            productName: product?.name || "",
            price: item.price || product?.price || 0,
            quantity: item.quantity,
            subtotal: discountedPrice * item.quantity,
            // Discount fields
            discountPrice: discountedPrice,
            discountAmount: discountAmount,
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
        createdAt: result.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
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

/**
 * GET /api/transactions
 * List transactions with pagination, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { invoiceNo: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "invoiceNo") {
      orderBy = { invoiceNo: sortOrder };
    } else if (sortBy === "date") {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "total") {
      orderBy = { totalAmount: sortOrder };
    } else if (sortBy === "cashier") {
      orderBy = { cashier: { name: sortOrder } };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          items: true,
          cashier: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          cancelLogs: {
            orderBy: { canceledAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
