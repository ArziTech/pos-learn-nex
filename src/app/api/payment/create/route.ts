import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSnapTransaction, getTransactionStatus } from "@/lib/midtrans";

/**
 * POST /api/payment/create
 * Create payment transaction with Midtrans Snap
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, paymentMethod, customerDetails } = body;

    if (!transactionId || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true, cashier: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if transaction is still pending
    if (transaction.paymentStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Transaction is not eligible for payment" },
        { status: 400 }
      );
    }

    // Determine enabled payments based on method
    const enabledPaymentsMap: Record<string, string[]> = {
      MIDTRANS_QRIS: ["qris"],
      MIDTRANS_EWALLET: ["gopay", "shopeepay", "ovo", "dana", "linkaja"],
      MIDTRANS_BANK_TRANSFER: ["bca_va", "bni_va", "bri_va", "mandiri_va", "permata_va", "cimb_va"],
      MIDTRANS_ALL: ["credit_card", "gopay", "shopeepay", "ovo", "dana", "linkaja", "qris", "bca_va", "bni_va", "bri_va", "mandiri_va", "permata_va"],
    };

    const enabledPayments = enabledPaymentsMap[paymentMethod] || enabledPaymentsMap.MIDTRANS_ALL;

    // Create Snap transaction
    const snapResult = await createSnapTransaction(
      transaction.invoiceNo,
      transaction.totalAmount,
      {
        name: customerDetails?.name || transaction.cashier.name || "Customer",
        email: customerDetails?.email || transaction.cashier.email || "customer@example.com",
        phone: customerDetails?.phone || "08123456789",
      },
      {
        enabledPayments,
        finishUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cashier?payment_status=success&order_id=${transaction.invoiceNo}`,
        errorUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cashier?payment_status=error&order_id=${transaction.invoiceNo}`,
        pendingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cashier?payment_status=pending&order_id=${transaction.invoiceNo}`,
      }
    );

    // Update transaction with payment details
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentType: paymentMethod,
        snapToken: snapResult.token,
        snapRedirectUrl: snapResult.redirect_url,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        transactionId,
        amount: transaction.totalAmount,
        paymentType: "MIDTRANS",
        paymentMethod: paymentMethod.toLowerCase().replace("midtrans_", ""),
        paymentStatus: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        token: snapResult.token,
        redirectUrl: snapResult.redirect_url,
      },
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
