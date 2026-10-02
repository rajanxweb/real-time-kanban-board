import type { Request, Response } from 'express';
import { AppError } from '../lib/AppError.js';
import { loginUser, registerUser } from '../services/authService.js';
import type { LoginBody, RegisterBody } from '../validators/auth.js';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body as RegisterBody);

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body as LoginBody);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Token is expired or invalid', 401, 'UNAUTHORIZED');
  }

  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}
