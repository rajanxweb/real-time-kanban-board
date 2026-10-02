import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);
  app.use(healthRouter);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
