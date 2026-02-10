"use client";

import { useState, useEffect } from "react";

// Extend Window interface for Midtrans Snap
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, Smartphone, Building2, Wallet } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ReceiptDialog, CartItem, TransactionDiscount } from "./ReceiptDialog";
import { useSession } from "next-auth/react";

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  method: string;
  description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "CASH",
    name: "Tunai",
    icon: <Wallet className="w-5 h-5" />,
    method: "cash",
    description: "Bayar langsung dengan uang tunai",
  },
  {
    id: "MIDTRANS_QRIS",
    name: "QRIS",
    icon: <QrCode className="w-5 h-5" />,
    method: "MIDTRANS_QRIS",
    description: "Scan QRIS dengan GoPay, OVO, Dana, dll",
  },
  {
    id: "MIDTRANS_EWALLET",
    name: "E-Wallet",
    icon: <Smartphone className="w-5 h-5" />,
    method: "MIDTRANS_EWALLET",
    description: "GoPay, ShopeePay, OVO, Dana, LinkAja",
  },
  {
    id: "MIDTRANS_BANK_TRANSFER",
    name: "Transfer Bank",
    icon: <Building2 className="w-5 h-5" />,
    method: "MIDTRANS_BANK_TRANSFER",
    description: "BCA, Mandiri, BNI, BRI, dll",
  },
];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  totalAmount: number;
  subtotal: number;
  transactionDiscount: TransactionDiscount;
  onSuccess: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  cart,
  totalAmount,
  subtotal,
  transactionDiscount,
  onSuccess,
}: PaymentDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastInvoiceNo, setLastInvoiceNo] = useState("");
  const [lastPaymentMethod, setLastPaymentMethod] = useState("");

  // Get payment status periodically if midtrans token exists
  useQuery({
    queryKey: ["payment-status"],
    enabled: false, // Only enable when checking status
    queryFn: async () => {
      const response = await axiosInstance.get("/api/payment/status");
      return response.data.data;
    },
    refetchInterval: (data: any) => {
      // Poll every 3 seconds if status is pending
      return data?.paymentStatus === "PENDING" ? 3000 : false;
    },
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
      setShowReceipt(false);
    }
  }, [open]);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!selectedMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    setIsProcessing(true);

    try {
      const discountPayload = transactionDiscount.type
        ? {
            discount: {
              type: transactionDiscount.type,
              value: transactionDiscount.value,
              amount: transactionDiscount.amount,
            },
          }
        : {};

      if (selectedMethod.id === "CASH") {
        // For cash payment, create completed transaction directly
        const response = await axiosInstance.post("/api/transactions", {
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discountedPrice: item.discountedPrice,
            discountAmount: item.discountAmount || 0,
          })),
          totalAmount,
          ...discountPayload,
        });

        const transaction = response.data.data;

        toast.success("Pembayaran tunai berhasil!", {
          description: `Invoice: ${transaction.invoiceNo}`,
        });

        setLastInvoiceNo(transaction.invoiceNo);
        setLastPaymentMethod("Tunai");
        setShowReceipt(true);
        onSuccess();
      } else {
        // For Midtrans payments, create pending transaction first
        const pendingResponse = await axiosInstance.post("/api/transactions/pending", {
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discountedPrice: item.discountedPrice,
            discountAmount: item.discountAmount || 0,
          })),
          totalAmount,
          paymentMethod: selectedMethod.method,
          ...discountPayload,
        });

        const transaction = pendingResponse.data.data;

        // Then create Midtrans payment
        const paymentResponse = await axiosInstance.post("/api/payment/create", {
          transactionId: transaction.id,
          paymentMethod: selectedMethod.method,
          customerDetails: {
            name: transaction.customerDetails.name,
            email: transaction.customerDetails.email,
          },
        });

        const { token } = paymentResponse.data.data;

        // Trigger Midtrans Snap popup
        if (window.snap) {
          window.snap.pay(token, {
            onSuccess: () => {
              toast.success("Pembayaran berhasil!");
              setLastInvoiceNo(transaction.invoiceNo);
              setLastPaymentMethod(selectedMethod.name);
              setShowReceipt(true);
              onSuccess();
            },
            onPending: () => {
              toast.info("Menunggu pembayaran...", {
                description: "Silakan selesaikan pembayaran Anda",
              });
              onOpenChange(false);
              router.push("/cashier");
            },
            onError: () => {
              toast.error("Pembayaran gagal", {
                description: "Terjadi kesalahan saat pembayaran",
              });
            },
            onClose: () => {
              // User closed popup without paying
              setIsProcessing(false);
            },
          });
        } else {
          toast.error("Midtrans Snap tidak terload");
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Gagal memproses pembayaran", {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Dialog open={open && !showReceipt} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
            <DialogDescription>
              Total: {formatCurrency(totalAmount)} ({totalItems} item)
            </DialogDescription>
          </DialogHeader>

          {/* Discount Summary */}
          {(transactionDiscount?.amount > 0 || cart.some((i) => i.discountAmount && i.discountAmount > 0)) && (
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {cart.some((i) => i.discountAmount && i.discountAmount > 0) && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Diskon Item</span>
                  <span>
                    -
                    {formatCurrency(
                      cart.reduce((sum, i) => sum + (i.discountAmount || 0), 0)
                    )}
                  </span>
                </div>
              )}
              {transactionDiscount?.amount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>
                    Diskon Transaksi (
                    {transactionDiscount.type === "PERCENTAGE"
                      ? `${transactionDiscount.value}%`
                      : formatCurrency(transactionDiscount.value)}
                    )
                  </span>
                  <span>-{formatCurrency(transactionDiscount.amount)}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 my-4">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => handlePaymentMethodSelect(method)}
                disabled={isProcessing}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                  ${selectedMethod?.id === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                  }
                  ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className={`p-2 rounded-full ${
                  selectedMethod?.id === method.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  {method.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{method.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {method.description}
                  </div>
                </div>
                {selectedMethod?.id === method.id && (
                  <Badge variant="default" className="shrink-0">
                    Dipilih
                  </Badge>
                )}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              onClick={handleProceedToPayment}
              disabled={!selectedMethod || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Bayar Sekarang"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceipt}
        onOpenChange={(open) => {
          setShowReceipt(open);
          if (!open) onOpenChange(false);
        }}
        invoiceNo={lastInvoiceNo}
        items={cart}
        subtotal={subtotal}
        discount={transactionDiscount}
        total={totalAmount}
        paymentMethod={lastPaymentMethod}
        cashierName={session?.user?.name || "Kasir"}
      />
    </>
  );
}

// Re-export CartItem and TransactionDiscount types from ReceiptDialog
export type { CartItem, TransactionDiscount };
