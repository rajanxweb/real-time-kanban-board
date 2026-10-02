import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
