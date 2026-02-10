import { z } from "zod";

/**
 * Zod schema for creating a Staff
 * Password is required for creating a new user account
 */
export const createStaffSchema = z.object({
  name: z
    .string({
      error: "Nama lengkap wajib diisi",
    })
    .min(1, "Nama lengkap tidak boleh kosong")
    .trim(),
  username: z
    .string({
      error: "Username wajib diisi",
    })
    .min(3, "Username minimal 3 karakter")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username hanya boleh berisi huruf, angka, dan underscore"
    )
    .trim(),
  email: z.email("Format email tidak valid").trim(),
  password: z
    .string({
      error: "Password wajib diisi",
    })
    .min(6, "Password minimal 6 karakter"),
  phone: z
    .string({
      error: "Nomor telepon wajib diisi",
    })
    .min(10, "Nomor telepon minimal 10 karakter")
    .regex(
      /^[0-9+\-() ]+$/,
      "Nomor telepon hanya boleh berisi angka dan karakter +, -, (, )"
    )
    .trim(),
  branchId: z
    .string({
      error: "Cabang wajib dipilih",
    })
    .min(1, "Cabang wajib dipilih"),
  status: z.boolean().default(true),
});

/**
 * Zod schema for updating a Staff
 * Password is optional - only update if provided
 * Username cannot be changed (should be disabled in form)
 */
export const updateStaffSchema = z.object({
  name: z
    .string({
      error: "Nama lengkap wajib diisi",
    })
    .min(1, "Nama lengkap tidak boleh kosong")
    .trim()
    .optional(),
  email: z.email("Format email tidak valid").trim().optional(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")), // Allow empty string to indicate no password change
  phone: z
    .string({
      error: "Nomor telepon wajib diisi",
    })
    .min(10, "Nomor telepon minimal 10 karakter")
    .regex(
      /^[0-9+\-() ]+$/,
      "Nomor telepon hanya boleh berisi angka dan karakter +, -, (, )"
    )
    .trim()
    .optional(),
  branchId: z
    .string({
      error: "Cabang wajib dipilih",
    })
    .min(1, "Cabang wajib dipilih")
    .optional(),
  status: z.boolean().optional(),
});

/**
 * Zod schema for Staff response
 */
export const staffResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  branchId: z.string(),
  phone: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

/**
 * Zod schema for Staff with User and Branch relations
 */
export const staffWithRelationsSchema = staffResponseSchema.extend({
  user: z.object({
    id: z.string(),
    username: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    status: z.boolean(),
  }),
  branch: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type StaffResponse = z.infer<typeof staffResponseSchema>;
export type StaffWithRelations = z.infer<typeof staffWithRelationsSchema>;
