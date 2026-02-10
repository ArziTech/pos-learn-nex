"use client";

import { useState } from "react";

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
import { Loader2, CreditCard, QrCode, Smartphone, Building2, Wallet } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

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

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  totalAmount: number;
  onSuccess: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  cart,
  totalAmount,
  onSuccess,
}: PaymentDialogProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get payment status periodically if midtrans token exists
  const { data: paymentData } = useQuery({
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
      if (selectedMethod.id === "CASH") {
        // For cash payment, create completed transaction directly
        const response = await axiosInstance.post("/api/transactions", {
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount,
        });

        toast.success("Pembayaran tunai berhasil!", {
          description: `Invoice: ${response.data.data.invoiceNo}`,
        });

        onOpenChange(false);
        onSuccess();
      } else {
        // For Midtrans payments, create pending transaction first
        const pendingResponse = await axiosInstance.post("/api/transactions/pending", {
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount,
          paymentMethod: selectedMethod.method,
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
            onSuccess: (result: any) => {
              toast.success("Pembayaran berhasil!");
              onOpenChange(false);
              onSuccess();
            },
            onPending: (result: any) => {
              toast.info("Menunggu pembayaran...", {
                description: "Silakan selesaikan pembayaran Anda",
              });
              onOpenChange(false);
              router.push("/cashier");
            },
            onError: (result: any) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
          <DialogDescription>
            Total: {formatCurrency(totalAmount)} ({totalItems} item)
          </DialogDescription>
        </DialogHeader>

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
  );
}
