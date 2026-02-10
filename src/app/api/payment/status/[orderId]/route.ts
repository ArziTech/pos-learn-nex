import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus, mapMidtransStatus } from "@/lib/midtrans";

/**
 * GET /api/payment/status/:orderId
 * Get payment status from Midtrans
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    // Get status from Midtrans
    const midtransStatus = await getTransactionStatus(orderId);

    // Find transaction by invoice number
    const transaction = await prisma.transaction.findFirst({
      where: { invoiceNo: orderId },
      include: { payment: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Map Midtrans status to payment status
    const paymentStatus = mapMidtransStatus(midtransStatus.transaction_status);

    // Update payment record
    if (transaction.payment) {
      await prisma.payment.update({
        where: { id: transaction.payment.id },
        data: {
          paymentStatus: midtransStatus.transaction_status,
          fraudStatus: midtransStatus.fraud_status,
          transactionTime: midtransStatus.transaction_time
            ? new Date(midtransStatus.transaction_time)
            : null,
          midtransTransactionId: midtransStatus.transaction_id,
          statusCode: midtransStatus.status_code,
          statusMessage: midtransStatus.status_message,
          rawResponse: midtransStatus,
        },
      });
    }

    // Update transaction status based on payment
    if (paymentStatus === "PAID" && transaction.status === "PENDING") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "COMPLETED",
          paymentStatus,
          paidAt: new Date(),
        },
      });
    } else if (paymentStatus === "FAILED" || paymentStatus === "EXPIRED") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "CANCELED",
          paymentStatus,
        },
      });
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { paymentStatus },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionStatus: midtransStatus.transaction_status,
        fraudStatus: midtransStatus.fraud_status,
        paymentStatus,
      },
    });
  } catch (error: any) {
    console.error("Error getting payment status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
