import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/AppError.js';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const production = isProduction();

  if (err instanceof AppError) {
    if (err.code) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      });
      return;
    }

    res.status(err.statusCode).json({
      message: err.message,
      ...(production ? {} : { stack: err.stack }),
    });
    return;
  }

  const message =
    !production && err instanceof Error ? err.message : 'Internal server error';
  const stack = !production && err instanceof Error ? err.stack : undefined;

  res.status(500).json(stack === undefined ? { message } : { message, stack });
}
