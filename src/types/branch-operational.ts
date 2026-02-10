import { z } from "zod";

/**
 * Zod schema for creating a BranchOperational
 */
export const createBranchOperationalSchema = z.object({
  name: z
    .string({
      error: "Nama cabang operasional wajib diisi",
    })
    .min(1, "Nama cabang operasional tidak boleh kosong")
    .trim(),
  address: z
    .string({
      error: "Alamat cabang operasional wajib diisi",
    })
    .min(1, "Alamat cabang operasional tidak boleh kosong")
    .trim(),
  phone: z
    .string({
      error: "Telepon cabang operasional wajib diisi",
    })
    .min(1, "Telepon cabang operasional tidak boleh kosong")
    .trim()
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
      "Format nomor telepon tidak valid"
    ),
  status: z.boolean(),
});

/**
 * Zod schema for updating a BranchOperational
 * All fields are optional for partial updates
 */
export const updateBranchOperationalSchema = z.object({
  name: z
    .string({
      error: "Nama cabang operasional harus berupa teks",
    })
    .min(1, "Nama cabang operasional tidak boleh kosong")
    .trim()
    .optional(),
  address: z
    .string({
      error: "Alamat cabang operasional harus berupa teks",
    })
    .min(1, "Alamat cabang operasional tidak boleh kosong")
    .trim()
    .optional(),
  phone: z
    .string({
      error: "Telepon cabang operasional wajib diisi",
    })
    .min(1, "Telepon cabang operasional tidak boleh kosong")
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Format nomor telepon tidak valid")
    .optional(),
  status: z.boolean().optional(),
});

/**
 * Zod schema for BranchOperational response
 */
export const branchOperationalResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  status: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type CreateBranchOperationalInput = z.infer<
  typeof createBranchOperationalSchema
>;
export type UpdateBranchOperationalInput = z.infer<
  typeof updateBranchOperationalSchema
>;
export type BranchOperationalResponse = z.infer<
  typeof branchOperationalResponseSchema
>;

/**
 * Type for BranchOperational with optional schedule relations
 */
export type BranchOperationalWithRelations = BranchOperationalResponse & {
  _count?: {
    schedules: number;
  };
};
