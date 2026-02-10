import { z } from "zod";

// Field validators
const usernameSchema = z
  .string()
  .min(3, "Username minimal 3 karakter")
  .max(50, "Username maksimal 50 karakter")
  .regex(/^[a-z0-9_-]+$/, "Username hanya boleh huruf kecil, angka, - dan _")
  .transform((val) => val.toLowerCase());

const emailSchema = z.string().email("Email tidak valid");

const passwordSchema = z.string().min(6, "Password minimal 6 karakter");

const nameSchema = z.string().min(2, "Nama minimal 2 karakter");

const roleIdSchema = z.number().int().positive("Role harus dipilih");

const statusSchema = z.boolean().default(true);

// Create User Schema
export const createUserSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    name: nameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
    roleId: roleIdSchema,
    status: statusSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

// Type export
export type CreateUserInput = z.infer<typeof createUserSchema>;
