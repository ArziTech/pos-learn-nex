"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Permission } from "@prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, "Nama role wajib diisi"),
  description: z.string().optional(),
  byPassAllFeatures: z.boolean(),
  permissionIds: z.array(z.number()),
});

type CreateRoleInput = z.infer<typeof createRoleSchema>;

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRoleDialogProps) {
  const [bypassEnabled, setBypassEnabled] = useState(false);

  // Fetch permissions for multi-select
  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: Permission[] }>("/api/permissions");
      return response.data;
    },
    enabled: open,
  });

  const permissionOptions = (permissionsData?.data || []).map((perm) => ({
    label: `${perm.label} (${perm.module || "other"})`,
    value: perm.id.toString(),
  }));

  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      description: "",
      byPassAllFeatures: false,
      permissionIds: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      const response = await axiosInstance.post("/api/roles", data);
      return response;
    },
    onSuccess: () => {
      toast.success("Role berhasil dibuat");
      form.reset();
      setBypassEnabled(false);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal membuat role";
      toast.error(message);
    },
  });

  const handleSubmit = (data: CreateRoleInput) => {
    createMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setBypassEnabled(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Role Baru</DialogTitle>
          <DialogDescription>
            Buat role baru dengan permission yang sesuai
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Role</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: MANAGER"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Nama role menggunakan huruf kapital
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi role..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="byPassAllFeatures"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Akses Penuh</FormLabel>
                    <FormDescription>
                      Role ini dapat mengakses semua fitur tanpa batasan
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setBypassEnabled(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!bypassEnabled && (
              <FormField
                control={form.control}
                name="permissionIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={permissionOptions}
                        selected={field.value.map((id) => id.toString())}
                        onChange={(values) =>
                          field.onChange(values.map((v) => parseInt(v)))
                        }
                        placeholder="Pilih permissions..."
                      />
                    </FormControl>
                    <FormDescription>
                      Pilih permission yang akan diberikan ke role ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
  );
}
