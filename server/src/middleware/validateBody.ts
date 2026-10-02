import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../lib/AppError.js';

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));

      next(
        new AppError(
          details[0]?.message ?? 'Invalid request body',
          400,
          'VALIDATION_ERROR',
          details,
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}
