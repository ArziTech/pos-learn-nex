"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Role, User } from "@prisma/client";
import axiosInstance from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AutoComplete,
  AutoCompleteOption,
} from "@/components/scm-ui/AutoComplete/AutoComplete";
import { Switch } from "@/components/ui/switch";
import {
  updateUserSchema,
  type UpdateUserInput,
} from "../_validations/updateUserSchema";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess?: () => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch roles for select dropdown
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: Role[] }>("/api/roles");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const roleOptions: AutoCompleteOption[] = (rolesData?.data || []).map((role) => ({
    value: role.id.toString(),
    label: role.name,
    subLabel: role.description || undefined,
  }));

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    values: {
      username: user?.username || "",
      email: user?.email ?? null,
      name: user?.name || "",
      password: undefined,
      confirmPassword: undefined,
      roleId: user?.roleId || 0,
      status: user?.status || false,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUserInput) => {
      if (!user) throw new Error("User tidak ditemukan");
      const response = await axiosInstance.put(`/api/users/${user.id}`, data);
      return response;
    },
    onSuccess: () => {
      toast.success("User berhasil diupdate");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal mengupdate user";
      toast.error(message);
    },
  });

  const handleSubmit = (data: UpdateUserInput) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update informasi pengguna. Kosongkan password jika tidak ingin
            mengubahnya.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="username"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toLowerCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Hanya huruf kecil, angka, tanda hubung (-) dan underscore
                    (_)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <AutoComplete
                      value={roleOptions.find(
                        (opt) => opt.value === field.value?.toString()
                      )}
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : undefined)
                      }
                      options={roleOptions}
                      placeholder="Pilih role"
                      error={form.formState.errors.roleId?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru (Opsional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Kosongkan jika tidak ingin mengubah"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password Baru</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ketik ulang password baru"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Akun</FormLabel>
                    <FormDescription>
                      Aktifkan atau nonaktifkan akun pengguna
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
