"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { User } from "@prisma/client";
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

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess?: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: DeleteUserDialogProps) {
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User tidak ditemukan");
      const response = await axiosInstance.delete(`/api/users/${user.id}`);
      return response;
    },
    onSuccess: () => {
      toast.success("User berhasil dihapus");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal menghapus user";
      toast.error(message);
    },
  });

  const handleConfirm = () => {
    deleteMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus User</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus user{" "}
            <strong>{user?.username}</strong>?
            <br />
            <br />
            User akan di-nonaktifkan (soft delete) dan tidak akan bisa login
            lagi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
