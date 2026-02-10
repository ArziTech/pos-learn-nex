import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

/**
 * POST /api/transactions/[id]/cancel
 * Cancel a transaction and restore stock
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermission(session.user.id, "transaction");

    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Alasan pembatalan wajib diisi" },
        { status: 400 }
      );
    }

    // Fetch transaction with items
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                stock: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if already canceled
    if (transaction.status === "CANCELED") {
      return NextResponse.json(
        { error: "Transaksi sudah dibatalkan sebelumnya" },
        { status: 400 }
      );
    }

    // Check 24 hour rule
    const now = new Date();
    const transactionDate = new Date(transaction.createdAt);
    const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return NextResponse.json(
        { error: "Tidak dapat membatalkan transaksi lebih dari 24 jam" },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Restore stock for each item
      for (const item of transaction.items) {
        if (item.product.stock) {
          await tx.stock.update({
            where: { productId: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // 2. Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: "CANCELED",
          canceledAt: now,
          canceledBy: session.user.id,
        },
      });

      // 3. Log the cancellation
      await tx.transactionCancelLog.create({
        data: {
          transactionId,
          reason: reason.trim(),
          canceledBy: session.user.id,
          canceledAt: now,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibatalkan",
    });
  } catch (error: any) {
    console.error("Error canceling transaction:", error);

    if (error.message?.startsWith("Permission denied")) {
      return NextResponse.json(
        { error: "Forbidden", details: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
