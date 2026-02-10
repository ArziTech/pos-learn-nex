"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface DeleteProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: DeleteProductDialogProps) {
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await axiosInstance.delete(`/api/products/${productId}`);
      return response;
    },
    onSuccess: () => {
      toast.success("Produk berhasil dihapus");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal menghapus produk";
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (product) {
      deleteMutation.mutate(product.id);
    }
  };

  // Reset mutation when dialog closes
  useEffect(() => {
    if (!open) {
      deleteMutation.reset();
    }
  }, [open, deleteMutation]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Hapus Produk
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak
                dapat dibatalkan.
              </p>
              {product && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Ya, Hapus"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
