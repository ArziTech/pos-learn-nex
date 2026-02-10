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

interface RoleWithPermissions {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

interface DeleteRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithPermissions | null;
  onSuccess?: () => void;
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: DeleteRoleDialogProps) {
  const deleteMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await axiosInstance.delete(`/api/roles/${roleId}`);
      return response;
    },
    onSuccess: () => {
      toast.success("Role berhasil dihapus");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal menghapus role";
      toast.error(message);
    },
  });

  const handleDelete = () => {
    if (role) {
      deleteMutation.mutate(role.id);
    }
  };

  if (!role) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Role?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Anda yakin ingin menghapus role <strong>{role.name}</strong>?
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
