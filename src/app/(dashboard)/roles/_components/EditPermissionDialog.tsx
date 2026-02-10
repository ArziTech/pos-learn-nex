"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const editPermissionSchema = z.object({
  code: z.string().min(1, "Code wajib diisi"),
  label: z.string().min(1, "Label wajib diisi"),
  description: z.string().optional(),
  module: z.string().optional(),
  isSection: z.boolean(),
  sequence: z.number().min(0),
  showOnSidebar: z.boolean(),
  href: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.number().optional(),
});

type EditPermissionInput = z.infer<typeof editPermissionSchema>;

interface EditPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission: Permission | null;
  onSuccess?: () => void;
}

export function EditPermissionDialog({
  open,
  onOpenChange,
  permission,
  onSuccess,
}: EditPermissionDialogProps) {
  const [isSection, setIsSection] = useState(false);

  // Fetch permissions for parent select
  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: Permission[] }>("/api/permissions");
      return response.data;
    },
    enabled: open,
  });

  // Filter out current permission from parent options
  const parentPermissions = (permissionsData?.data || [])
    .filter((p) => p.id !== permission?.id && !p.isSection);

  const form = useForm<EditPermissionInput>({
    resolver: zodResolver(editPermissionSchema),
    defaultValues: {
      code: "",
      label: "",
      description: "",
      module: "",
      isSection: false,
      sequence: 0,
      showOnSidebar: false,
      href: "",
      icon: "",
      parentId: undefined,
    },
  });

  // Update form when permission changes
  useEffect(() => {
    if (permission) {
      form.reset({
        code: permission.code,
        label: permission.label,
        description: permission.description || "",
        module: permission.module || "",
        isSection: permission.isSection,
        sequence: permission.sequence,
        showOnSidebar: permission.showOnSidebar,
        href: permission.href || "",
        icon: permission.icon || "",
        parentId: permission.parentId || undefined,
      });
      setIsSection(permission.isSection);
    }
  }, [permission, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditPermissionInput) => {
      const response = await axiosInstance.put(`/api/permissions/${permission?.id}`, data);
      return response;
    },
    onSuccess: () => {
      toast.success("Permission berhasil diupdate");
      form.reset();
      setIsSection(false);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal mengupdate permission";
      toast.error(message);
    },
  });

  const handleSubmit = (data: EditPermissionInput) => {
    updateMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setIsSection(false);
    }
    onOpenChange(newOpen);
  };

  if (!permission) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permission</DialogTitle>
          <DialogDescription>
            Update permission dengan detail yang sesuai
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="user"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="User Management"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi permission..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="master"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toLowerCase())
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sequence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sequence</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isSection"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Section</FormLabel>
                    <FormDescription>
                      Jadikan sebagai section header di sidebar
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setIsSection(checked);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isSection && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="href"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Href</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="/users"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Users"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Nama icon dari lucide-react
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="showOnSidebar"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show on Sidebar</FormLabel>
                        <FormDescription>
                          Tampilkan di sidebar navigation
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

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Permission</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value ? parseInt(value) : undefined)
                        }
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih parent (opsional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parentPermissions.map((perm) => (
                            <SelectItem
                              key={perm.id}
                              value={perm.id.toString()}
                            >
                              {perm.label} ({perm.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Parent permission untuk hierarki
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
