import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const usesNeonPooler = new URL(env.DATABASE_URL).hostname.includes('-pooler.');
const prismaOptions = usesNeonPooler
  ? { adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }) }
  : undefined;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
