import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const healthRouter = Router();

healthRouter.get('/health', requireAuth, asyncHandler(getHealth));
