import * as z from "zod";

export const emailSchema = z.email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password must be less than 100 characters");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters");
