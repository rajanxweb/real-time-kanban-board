import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

const accessTokenPayloadSchema = z.object({
  userId: z.string().min(1),
  email: z.string().min(1),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const parsed = accessTokenPayloadSchema.safeParse(decoded);

    if (!parsed.success) {
      throw new AppError(
        'Token is expired or invalid',
        401,
        'UNAUTHORIZED',
      );
    }

    return parsed.data;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError('Token is expired or invalid', 401, 'UNAUTHORIZED');
  }
}
