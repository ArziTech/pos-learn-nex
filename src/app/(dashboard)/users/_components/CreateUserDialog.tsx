"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import axiosInstance from "@/lib/axios";
import { Role } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  createUserSchema,
  type CreateUserInput,
} from "../_validations/createUserSchema";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DeletedUser {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  deletedAt: string;
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [deletedUserToRestore, setDeletedUserToRestore] =
    useState<DeletedUser | null>(null);
  const [pendingFormData, setPendingFormData] =
    useState<CreateUserInput | null>(null);

  // Fetch roles for select dropdown
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: Role[] }>("/api/roles");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const roleOptions: AutoCompleteOption[] = (rolesData?.data || []).map(
    (role) => ({
      value: role.id.toString(),
      label: role.name,
      subLabel: role.description || undefined,
    })
  );

  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
      status: true,
      roleId: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({
      data,
      restore = false,
    }: {
      data: CreateUserInput;
      restore?: boolean;
    }) => {
      const url = restore ? "/api/users?restore=true" : "/api/users";
      const response = await axiosInstance.post(url, data);
      return response;
    },
    onSuccess: (response) => {
      if (response.data.restored) {
        toast.success("User berhasil di-restore");
      } else {
        toast.success("User berhasil dibuat");
      }
      form.reset();
      setPendingFormData(null);
      setDeletedUserToRestore(null);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const responseData = error.response?.data;

      // Check if this is a canRestore response
      if (responseData?.canRestore && responseData?.deletedUser) {
        setDeletedUserToRestore(responseData.deletedUser);
        const formValues = form.getValues();
        setPendingFormData({
          ...formValues,
          status: formValues.status ?? true,
        });
        setShowRestoreConfirm(true);
        return;
      }

      const message = responseData?.error || "Gagal membuat user";
      toast.error(message);
    },
  });

  const handleSubmit = (data: CreateUserInput) => {
    createMutation.mutate({ data, restore: false });
  };

  const handleRestoreConfirm = () => {
    if (pendingFormData) {
      createMutation.mutate({ data: pendingFormData, restore: true });
    }
    setShowRestoreConfirm(false);
  };

  const handleRestoreCancel = () => {
    setShowRestoreConfirm(false);
    setDeletedUserToRestore(null);
    setPendingFormData(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset(); // Reset when closing dialog
      setPendingFormData(null);
      setDeletedUserToRestore(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              Buat akun pengguna baru dengan mengisi form di bawah ini
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
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
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Ketik ulang password"
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={showRestoreConfirm}
        onOpenChange={setShowRestoreConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User Ditemukan</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  User dengan username/email ini pernah dihapus sebelumnya.
                  Apakah Anda ingin merestore user tersebut dengan data yang
                  baru diinput?
                </p>
                {deletedUserToRestore && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p>
                      <strong>Username:</strong> {deletedUserToRestore.username}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {deletedUserToRestore.email || "-"}
                    </p>
                    <p>
                      <strong>Nama:</strong> {deletedUserToRestore.name || "-"}
                    </p>
                    <p>
                      <strong>Dihapus pada:</strong>{" "}
                      {format(deletedUserToRestore.deletedAt, "dd MMMM yyyy", {
                        locale: id,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRestoreCancel}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Merestore..." : "Ya, Restore User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
