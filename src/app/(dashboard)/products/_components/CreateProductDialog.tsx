"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package } from "lucide-react";
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
  createProductSchema,
  type CreateProductInput,
} from "../_validations/createProductSchema";

interface Category {
  id: number;
  title: string;
}

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProductDialogProps) {
  // Fetch categories for select dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: Category[] }>("/api/categories");
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions: AutoCompleteOption[] = (categoriesData?.data || []).map(
    (category) => ({
      value: category.id.toString(),
      label: category.title,
    })
  );

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      categoryId: null,
      stock: 0,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await axiosInstance.post("/api/products", data);
      return response;
    },
    onSuccess: () => {
      toast.success("Produk berhasil ditambahkan");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal menambahkan produk";
      toast.error(message);
    },
  });

  const handleSubmit = (data: CreateProductInput) => {
    createMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Tambah Produk Baru
          </DialogTitle>
          <DialogDescription>
            Buat produk baru dengan mengisi form di bawah ini
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Produk</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Nasi Goreng" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: NG001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <FormControl>
                    <AutoComplete
                      value={categoryOptions.find(
                        (opt) => opt.value === field.value?.toString()
                      )}
                      onValueChange={(value) =>
                        field.onChange(value ? parseInt(value) : null)
                      }
                      options={categoryOptions}
                      placeholder="Pilih kategori (opsional)"
                      error={form.formState.errors.categoryId?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stok Awal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Produk</FormLabel>
                    <FormDescription>
                      Aktifkan atau nonaktifkan produk
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
  );
}
