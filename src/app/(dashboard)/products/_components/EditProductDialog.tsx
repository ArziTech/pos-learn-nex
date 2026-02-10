"use client";

import { useEffect } from "react";
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

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  categoryId: number | null;
  isActive: boolean;
  stock?: {
    quantity: number;
  } | null;
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: EditProductDialogProps) {
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

  // Update form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        price: product.price,
        categoryId: product.categoryId,
        stock: product.stock?.quantity || 0,
        isActive: product.isActive,
      });
    }
  }, [product, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await axiosInstance.put(`/api/products/${product?.id}`, data);
      return response;
    },
    onSuccess: () => {
      toast.success("Produk berhasil diperbarui");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Gagal memperbarui produk";
      toast.error(message);
    },
  });

  const handleSubmit = (data: CreateProductInput) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Edit Produk
          </DialogTitle>
          <DialogDescription>
            Perbarui informasi produk
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
                  <FormLabel>Stok</FormLabel>
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
