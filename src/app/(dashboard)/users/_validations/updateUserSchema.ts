import { z } from "zod";

// Field validators
const usernameSchema = z
  .string()
  .min(3, "Username minimal 3 karakter")
  .max(50, "Username maksimal 50 karakter")
  .regex(/^[a-z0-9_-]+$/, "Username hanya boleh huruf kecil, angka, - dan _")
  .transform((val) => val.toLowerCase());

const emailSchema = z.string().email("Email tidak valid").nullable();

const nameSchema = z.string().min(2, "Nama minimal 2 karakter");

const roleIdSchema = z.number({ message: "Role harus dipilih" });

const statusSchema = z.boolean();

// Update User Schema
export const updateUserSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    name: nameSchema,
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    roleId: roleIdSchema,
    status: statusSchema,
  })
  .refine(
    (data) => {
      if (data.password || data.confirmPassword) {
        if (!data.password || !data.confirmPassword) return false;
        if (data.password.length < 6 || data.confirmPassword.length < 6)
          return false;
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message:
        "Password tidak cocok atau tidak memenuhi syarat minimal 6 karakter",
      path: ["confirmPassword"],
    }
  );

// Type export
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
