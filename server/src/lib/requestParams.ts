import { z } from 'zod';
import { AppError } from './AppError.js';

const pathParamSchema = z.string().min(1);

export function readPathParam(value: string | string[], field: string): string {
  const result = pathParamSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(
      `Invalid ${field}`,
      400,
      'VALIDATION_ERROR',
      [{ field, message: result.error.issues[0]?.message ?? 'Required' }],
    );
  }

  return result.data;
}
