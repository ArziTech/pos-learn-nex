import { z } from "zod";

/**
 * Zod schema for creating a Program
 */

export const gradeListSchema = z.object({
  name: z.string().min(1, "Nama grade tidak boleh kosong").trim(),
});

export const updatedGradeListSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama grade tidak boleh kosong").trim(),
});

export const createProgramSchema = z.object({
  name: z
    .string({
      error: "Nama program wajib diisi",
    })
    .min(1, "Nama program tidak boleh kosong")
    .trim(),
  duration: z
    .number({
      error: "harus diisi angka",
    })
    .min(1, "Durasi program harus lebih dari 0 menit"),
  gradeLists: z
    .array(gradeListSchema)
    .min(1, "Minimal 1 grade harus ditambahkan")
    .superRefine((list, ctx) => {
      const seen = new Map();
      list.forEach((item, idx) => {
        if (seen.has(item.name)) {
          ctx.addIssue({
            code: "custom",
            message: "Setiap grade harus mempunyai nama unik.",
            path: [idx, "name"],
          });
        } else {
          seen.set(item.name, idx);
        }
      });
    }),
});

/**
 * Zod schema for updating a Program
 * All fields are optional for partial updates
 */
export const updateProgramSchema = z.object({
  name: z
    .string({
      error: "Nama program harus berupa teks",
    })
    .min(1, "Nama program tidak boleh kosong")
    .trim()
    .optional(),
  duration: z
    .number({
      error: "Durasi program wajib diisi",
    })
    .min(1, "Durasi program harus lebih dari 0 menit")
    .optional(),
  gradeLists: z
    .array(updatedGradeListSchema)
    .min(1, "Minimal 1 grade harus ditambahkan")
    .superRefine((list, ctx) => {
      const seen = new Map();
      list.forEach((item, idx) => {
        if (seen.has(item.name)) {
          ctx.addIssue({
            code: "custom",
            message: "Setiap grade harus mempunyai nama unik.",
            path: [idx, "name"],
          });
        } else {
          seen.set(item.name, idx);
        }
      });
    }),
});

/**
 * Zod schema for Program response
 */
export const programResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  duration: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Zod schema for Grade in Program response
 */
export const programGradeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Zod schema for Program with Grade relation
 */
export const programWithRelationsSchema = programResponseSchema.extend({
  grades: z.array(programGradeSchema).optional(),
  _count: z
    .object({
      schedules: z.number(),
    })
    .optional(),
});

/**
 * TypeScript types derived from Zod schemas
 */
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type ProgramResponse = z.infer<typeof programResponseSchema>;
export type GradeInProgram = z.infer<typeof programGradeSchema>;
export type ProgramWithRelations = z.infer<typeof programWithRelationsSchema>;
