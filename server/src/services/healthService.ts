import { AppError } from '../lib/AppError.js';
import { prisma } from '../lib/prisma.js';

export async function checkDatabase(): Promise<{ status: 'ok' }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  } catch {
    throw new AppError('Database is not reachable', 503);
  }
}
