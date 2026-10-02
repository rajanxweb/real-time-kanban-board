import { z } from 'zod';

export const createBoardBodySchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
});

export const updateBoardBodySchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(1000).optional(),
  })
  .refine((body) => body.title !== undefined || body.description !== undefined);

export const addBoardMemberBodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type CreateBoardBody = z.infer<typeof createBoardBodySchema>;
export type UpdateBoardBody = z.infer<typeof updateBoardBodySchema>;
export type AddBoardMemberBody = z.infer<typeof addBoardMemberBodySchema>;
