import { NextRequest, NextResponse } from "next/server";
import { verifyNotificationSignature, mapMidtransStatus } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/payment/webhook
 * Handle Midtrans payment notifications
 */
export async function POST(request: NextRequest) {
  try {
    const notificationJson = await request.json();

    console.log("Midtrans webhook received:", notificationJson);

    // Verify signature
    const isValid = verifyNotificationSignature(notificationJson);

    if (!isValid) {
      console.error("Invalid signature for notification:", notificationJson.order_id);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const { order_id, transaction_status, fraud_status, payment_type } = notificationJson;

    // Find transaction by invoice number
    const transaction = await prisma.transaction.findFirst({
      where: { invoiceNo: order_id },
      include: { items: true, payment: true },
    });

    if (!transaction) {
      console.log(`Transaction not found for order_id: ${order_id}`);
      // Return 200 to prevent Midtrans from retrying
      return NextResponse.json({ success: true });
    }

    // Map Midtrans status to payment status
    const paymentStatus = mapMidtransStatus(transaction_status);

    // Update or create payment record
    if (transaction.payment) {
      await prisma.payment.update({
        where: { id: transaction.payment.id },
        data: {
          paymentStatus: transaction_status,
          fraudStatus: fraud_status,
          paymentMethod: payment_type,
          transactionTime: notificationJson.transaction_time
            ? new Date(notificationJson.transaction_time)
            : null,
          midtransTransactionId: notificationJson.transaction_id,
          statusCode: notificationJson.status_code,
          statusMessage: notificationJson.status_message,
          rawResponse: notificationJson,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          transactionId: transaction.id,
          amount: transaction.totalAmount,
          paymentType: "MIDTRANS",
          paymentMethod: payment_type,
          paymentStatus: transaction_status,
          fraudStatus: fraud_status,
          transactionTime: notificationJson.transaction_time
            ? new Date(notificationJson.transaction_time)
            : null,
          midtransTransactionId: notificationJson.transaction_id,
          statusCode: notificationJson.status_code,
          statusMessage: notificationJson.status_message,
          rawResponse: notificationJson,
        },
      });
    }

    // Update transaction status based on payment
    if (paymentStatus === "PAID" && transaction.status === "PENDING") {
      // For card transactions with fraud_status 'challenge', keep as pending
      if (fraud_status === "challenge") {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { paymentStatus },
        });
      } else {
        // Update to COMPLETED and set paidAt
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "COMPLETED",
            paymentStatus: "PAID",
            paidAt: new Date(),
          },
        });
      }
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
