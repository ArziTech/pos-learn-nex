"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Receipt, Download, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "../page";

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md print:max-w-none print:w-full print:max-h-none print:rounded-none print:border-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Detail Transaksi
          </DialogTitle>
          <DialogDescription>
            Invoice: {transaction.invoiceNo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 print:space-y-2">
          {/* Header */}
          <div className="text-center print:text-left">
            <h3 className="text-lg font-bold">POS System</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm", {
                locale: id,
              })}
            </p>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Item Pembelian</h4>
            <div className="space-y-2">
              {transaction.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm print:text-xs"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(transaction.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                {formatCurrency(transaction.totalAmount)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Info */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Kasir</span>
            <span>{transaction.cashier.name || transaction.cashier.username}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Status</span>
            <Badge
              variant={transaction.status === "COMPLETED" ? "default" : "destructive"}
              className={
                transaction.status === "COMPLETED"
                  ? "bg-green-500 hover:bg-green-600 print:bg-green-500"
                  : ""
              }
            >
              {transaction.status === "COMPLETED" ? "Selesai" : "Batal"}
            </Badge>
          </div>

          {/* Cancellation Info */}
          {transaction.status === "CANCELED" && (
            <>
              <div className="flex justify-between text-sm text-destructive">
                <span>Dibatalkan pada</span>
                <span>
                  {transaction.canceledAt
                    ? format(new Date(transaction.canceledAt), "dd MMM yyyy, HH:mm", {
                        locale: id,
                      })
                    : "-"}
                </span>
              </div>
              {transaction.cancelLogs && transaction.cancelLogs.length > 0 && (
                <div className="bg-destructive/10 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-destructive">Alasan Pembatalan:</p>
                  <p className="text-sm">{transaction.cancelLogs[0].reason}</p>
                </div>
              )}
            </>
          )}

          {/* Actions - Hidden when printing */}
          <div className="flex gap-2 pt-4 print:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrint}
            >
              <Printer className="w-4 h-4 mr-2" />
              Cetak
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
