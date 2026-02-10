/**
 * Midtrans Payment Gateway Service
 * Handles Snap API integration for payment processing
 */

interface SnapTransactionRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  credit_card?: {
    secure: boolean;
  };
  customer_details: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  enabled_payments?: string[];
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
}

interface SnapTransactionResponse {
  token: string;
  redirect_url: string;
}

interface MidtransNotificationPayload {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
}

/**
 * Create Snap transaction token
 */
export async function createSnapTransaction(
  orderId: string,
  grossAmount: number,
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  },
  options?: {
    enabledPayments?: string[];
    finishUrl?: string;
    errorUrl?: string;
    pendingUrl?: string;
  }
): Promise<SnapTransactionResponse> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }

  const apiUrl = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  // Parse customer name
  const nameParts = customerDetails.name.trim().split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "";

  const requestBody: SnapTransactionRequest = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name: firstName,
      last_name: lastName,
      email: customerDetails.email,
      phone: customerDetails.phone,
    },
    ...(options?.enabledPayments && {
      enabled_payments: options.enabledPayments,
    }),
    ...(options?.finishUrl || options?.errorUrl || options?.pendingUrl ? {
      callbacks: {
        ...(options?.finishUrl && { finish: options.finishUrl }),
        ...(options?.errorUrl && { error: options.errorUrl }),
        ...(options?.pendingUrl && { pending: options.pendingUrl }),
      },
    } : {}),
  };

  try {
    console.log("Midtrans request:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      token: data.token,
      redirect_url: data.redirect_url,
    };
  } catch (error) {
    console.error("Midtrans Snap API error:", error);
    throw error;
  }
}

/**
 * Get transaction status from Midtrans
 */
export async function getTransactionStatus(orderId: string) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }

  const apiUrl = isProduction
    ? `https://api.midtrans.com/v2/${orderId}/status`
    : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Midtrans API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Verify Midtrans notification signature
 */
export function verifyNotificationSignature(
  notification: MidtransNotificationPayload
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const orderId = notification.order_id;
  const statusCode = notification.status_code;
  const grossAmount = notification.gross_amount;

  if (!serverKey) {
    return false;
  }

  // Create signature key
  const rawSignature = `${orderId}${statusCode}${grossAmount}${serverKey}`;

  // Using crypto-js for SHA512 hashing
  const CryptoJS = require("crypto-js");
  const calculatedSignature = CryptoJS.SHA512(rawSignature).toString();

  return calculatedSignature === notification.signature_key;
}

/**
 * Map Midtrans transaction status to payment status
 */
export function mapMidtransStatus(midtransStatus: string): "PENDING" | "PAID" | "FAILED" | "EXPIRED" {
  switch (midtransStatus) {
    case "capture":
    case "settlement":
      return "PAID";
    case "pending":
      return "PENDING";
    case "deny":
    case "cancel":
      return "FAILED";
    case "expire":
      return "EXPIRED";
    case "authorize":
      return "PENDING";
    default:
      return "PENDING";
  }
}

export type { MidtransNotificationPayload };
