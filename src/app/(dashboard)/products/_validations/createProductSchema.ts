import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  sku: z.string().min(1, "SKU wajib diisi"),
  price: z.number().min(1, "Harga harus lebih dari 0"),
  categoryId: z.number().nullable().optional(),
  stock: z.number().min(0, "Stok tidak boleh negatif"),
  isActive: z.boolean(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.number(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
