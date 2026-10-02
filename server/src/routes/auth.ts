import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validateBody.js';
import { loginBodySchema, registerBodySchema } from '../validators/auth.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerBodySchema),
  asyncHandler(register),
);

authRouter.post('/login', validateBody(loginBodySchema), asyncHandler(login));

authRouter.get('/me', requireAuth, asyncHandler(getMe));
