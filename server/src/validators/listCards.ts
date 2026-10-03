import { z } from 'zod';

const positionSchema = z.number().finite();
const dateSchema = z.iso.datetime({ offset: true });

export const createListBodySchema = z.object({
  title: z.string().min(1).max(80),
  position: positionSchema.optional(),
});

export const updateListBodySchema = z
  .object({
    title: z.string().min(1).max(80).optional(),
    position: positionSchema.optional(),
  })
  .refine((body) => body.title !== undefined || body.position !== undefined);

export const createCardBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  position: positionSchema.optional(),
  dueDate: dateSchema.optional(),
  assigneeId: z.string().min(1).optional(),
});

export const updateCardBodySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().nullable().optional(),
    dueDate: dateSchema.nullable().optional(),
    assigneeId: z.string().min(1).nullable().optional(),
  })
  .refine(
    (body) =>
      body.title !== undefined ||
      body.description !== undefined ||
      body.dueDate !== undefined ||
      body.assigneeId !== undefined,
  );

export const moveCardBodySchema = z.object({
  targetListId: z.string().min(1),
  position: positionSchema,
});

export type CreateListBody = z.infer<typeof createListBodySchema>;
export type UpdateListBody = z.infer<typeof updateListBodySchema>;
export type CreateCardBody = z.infer<typeof createCardBodySchema>;
export type UpdateCardBody = z.infer<typeof updateCardBodySchema>;
export type MoveCardBody = z.infer<typeof moveCardBodySchema>;
