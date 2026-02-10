import { z } from "zod";

// Reusable field validators (self-contained in this page)
export const usernameSchema = z
  .string()
  .min(3, "Username minimal 3 karakter")
  .transform((val) => val.toLowerCase());

export const passwordSchema = z.string().min(6, "Password minimal 6 karakter");

// Login Schema
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

// Type export
export type LoginInput = z.infer<typeof loginSchema>;
