"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { XCircle, Clock } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Transaction } from "../page";

interface CancelTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSuccess?: () => void;
}

export function CancelTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: CancelTransactionDialogProps) {
  const [reason, setReason] = useState("");

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await axiosInstance.post(`/api/transactions/${id}/cancel`, { reason });
      return response;
    },
    onSuccess: () => {
      toast.success("Transaksi berhasil dibatalkan. Stok telah dikembalikan.");
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal membatalkan transaksi";
      toast.error(message);
    },
  });

  const handleCancel = () => {
    if (!transaction) return;
    if (!reason.trim()) {
      toast.error("Alasan pembatalan wajib diisi");
      return;
    }
    cancelMutation.mutate({ id: transaction.id, reason });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason("");
    }
    onOpenChange(newOpen);
  };

  if (!transaction) return null;

  // Calculate hours until deadline
  const now = new Date();
  const transactionDate = new Date(transaction.createdAt);
  const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = 24 - hoursDiff;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Batalkan Transaksi
          </DialogTitle>
          <DialogDescription>
            Anda yakin ingin membatalkan transaksi ini? Stok akan dikembalikan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Info */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">No. Invoice</span>
              <span className="font-medium">{transaction.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tanggal</span>
              <span className="font-medium">
                {format(new Date(transaction.createdAt), "dd MMM yyyy, HH:mm", {
                  locale: id,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-medium">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(transaction.totalAmount)}
              </span>
            </div>
          </div>

          {/* Items to be restocked */}
          <div>
            <Label className="text-sm font-medium">Items yang akan dikembalikan:</Label>
            <div className="mt-2 space-y-1 text-sm">
              {transaction.items.map((item) => (
                <div key={item.id} className="flex justify-between text-muted-foreground">
                  <span>{item.productName}</span>
                  <span>×{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time warning */}
          {hoursRemaining > 0 && (
            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-sm">
                <span className="font-medium">Batas waktu: </span>
                {hoursRemaining >= 1
                  ? `${Math.floor(hoursRemaining)} jam ${Math.round((hoursRemaining % 1) * 60)} menit`
                  : `${Math.round(hoursRemaining * 60)} menit`}
                {" lagi"}
              </div>
            </div>
          )}

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Alasan Pembatalan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Masukkan alasan pembatalan transaksi..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending || !reason.trim()}
          >
            {cancelMutation.isPending ? "Memproses..." : "Ya, Batalkan Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
