import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRateLimit } from './middleware/authRateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './routes/auth.js';
import { boardsRouter } from './routes/boards.js';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(requestLogger);
  app.use(express.json({ limit: '1mb' }));
  app.use(healthRouter);
  app.use('/api/v1/auth', authRateLimit, authRouter);
  app.use('/api/v1/boards', boardsRouter);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
