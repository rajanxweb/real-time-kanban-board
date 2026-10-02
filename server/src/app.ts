import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './routes/auth.js';
import { boardsRouter } from './routes/boards.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);
  app.use(healthRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/boards', boardsRouter);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
