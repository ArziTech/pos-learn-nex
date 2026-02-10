"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Permission } from "@prisma/client";

interface DeletePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: Permission | null;
  onSuccess?: () => void;
}

export function DeletePermissionDialog({
  open,
  onOpenChange,
  permission,
  onSuccess,
}: DeletePermissionDialogProps) {
  const deleteMutation = useMutation({
    mutationFn: async (permissionId: number) => {
      const response = await axiosInstance.delete(`/api/permissions/${permissionId}`);
      return response;
    },
    onSuccess: () => {
      toast.success("Permission berhasil dihapus");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal menghapus permission";
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (permission) {
      deleteMutation.mutate(permission.id);
    }
  };

  if (!permission) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Permission?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Anda yakin ingin menghapus permission{" "}
                <strong>{permission.label}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Code: <code>{permission.code}</code>
              </p>
              <p className="text-sm text-muted-foreground">
                Tindakan ini tidak dapat dibatalkan.
              </p>
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
            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
