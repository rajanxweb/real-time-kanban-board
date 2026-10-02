import type { RequestHandler } from 'express';
import { AppError } from '../lib/AppError.js';
import { getUserFromAccessToken } from '../services/authService.js';

function readBearerToken(header: string | undefined): string {
  if (!header) {
    throw new AppError(
      'Missing or invalid authentication token',
      401,
      'UNAUTHORIZED',
    );
  }

  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(
      'Missing or invalid authentication token',
      401,
      'UNAUTHORIZED',
    );
  }

  return token;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = readBearerToken(req.headers.authorization);
    req.user = await getUserFromAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
};
