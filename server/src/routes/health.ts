import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const healthRouter = Router();

healthRouter.get('/health', asyncHandler(getHealth));
