import type { Request, Response } from 'express';
import { checkDatabase } from '../services/healthService.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const result = await checkDatabase();
  res.status(200).json(result);
}
