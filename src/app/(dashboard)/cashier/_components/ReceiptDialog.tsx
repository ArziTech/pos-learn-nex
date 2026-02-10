"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  subtotal: number;
  discountType?: "PERCENTAGE" | "NOMINAL" | null;
  discountValue?: number;
  discountedPrice?: number;
  discountAmount?: number;
}

export interface TransactionDiscount {
  type: "PERCENTAGE" | "NOMINAL" | null;
  value: number;
  amount: number;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNo: string;
  items: CartItem[];
  subtotal: number;
  discount: TransactionDiscount;
  total: number;
  paymentMethod: string;
  cashierName: string;
  autoPrint?: boolean;
  storeInfo?: {
    name: string;
    address: string;
    phone: string;
  };
}

export function ReceiptDialog({
  open,
  onOpenChange,
  invoiceNo,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  cashierName,
  autoPrint = true,
  storeInfo = {
    name: "POS System",
    address: "Jalan Contoh No. 123",
    phone: "(021) 1234-5678",
  },
}: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;

      // Create print-friendly version
      const printWindow = window.open("", "", "width=400,height=600");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${invoiceNo}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                width: 80mm;
                padding: 5mm;
                color: #000;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .receipt-header h2 {
                font-size: 16px;
                margin-bottom: 5px;
              }
              .receipt-header p {
                font-size: 11px;
                margin: 2px 0;
              }
              .receipt-info {
                margin-bottom: 10px;
              }
              .receipt-info p {
                margin: 2px 0;
              }
              .receipt-item {
                margin: 5px 0;
              }
              .receipt-item-name {
                font-weight: bold;
              }
              .receipt-item-detail {
                font-size: 11px;
              }
              .receipt-summary {
                margin-top: 10px;
                border-top: 1px dashed #000;
                padding-top: 10px;
              }
              .receipt-summary-row {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
              }
              .receipt-total {
                font-weight: bold;
                font-size: 14px;
                border-top: 1px dashed #000;
                padding-top: 5px;
                margin-top: 5px;
              }
              .receipt-footer {
                text-align: center;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px dashed #000;
              }
              .receipt-footer p {
                font-size: 11px;
                margin: 2px 0;
              }
              @media print {
                body {
                  width: 80mm;
                  font-size: 12px;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  }, [invoiceNo]);

  // Auto print when dialog opens
  useEffect(() => {
    if (open && autoPrint) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, autoPrint, handlePrint]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="print:hidden">
          <DialogTitle>Struk Pembelian</DialogTitle>
          <DialogDescription>Invoice: {invoiceNo}</DialogDescription>
        </DialogHeader>

        {/* Receipt Content */}
        <div ref={receiptRef} className="bg-white p-4 font-mono text-sm">
          {/* Store Header */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{storeInfo.name}</h2>
            <p className="text-xs">{storeInfo.address}</p>
            <p className="text-xs">{storeInfo.phone}</p>
          </div>

          <Separator className="my-2" />

          {/* Transaction Info */}
          <div className="space-y-1 mb-3 text-xs">
            <div className="flex justify-between">
              <span>No. Invoice:</span>
              <span>{invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{format(new Date(), "dd/MM/yyyy HH:mm", { locale: id })}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{cashierName}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Items */}
          <div className="space-y-2 mb-3">
            {items.map((item) => (
              <div key={item.id} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span>{formatCurrency((item.discountedPrice || item.price) * item.quantity)}</span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>
                    {item.quantity} x {formatCurrency(item.discountedPrice || item.price)}
                  </span>
                  {item.discountAmount && item.discountAmount > 0 && (
                    <span className="text-destructive">
                      -{formatCurrency(item.discountAmount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2" />

          {/* Summary */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            {/* Item Discounts */}
            {items.some((i) => i.discountAmount && i.discountAmount > 0) && (
              <div className="flex justify-between text-xs text-destructive">
                <span>Diskon Item:</span>
                <span>
                  -
                  {formatCurrency(
                    items.reduce((sum, i) => sum + (i.discountAmount || 0), 0)
                  )}
                </span>
              </div>
            )}

            {/* Transaction Discount */}
            {discount && discount.amount > 0 && (
              <div className="flex justify-between text-xs text-destructive">
                <span>
                  Diskon Transaksi ({discount.type === "PERCENTAGE" ? `${discount.value}%` : formatCurrency(discount.value)}):
                </span>
                <span>-{formatCurrency(discount.amount)}</span>
              </div>
            )}

            <Separator className="my-2" />

            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <div className="flex justify-between text-xs mt-2">
              <span>Metode Pembayaran:</span>
              <span>{paymentMethod}</span>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Footer */}
          <div className="text-center mt-4 text-xs">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          </div>
        </div>

        {/* Actions - Hidden when printing */}
        <div className="flex gap-2 mt-4 print:hidden">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Tutup
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
