import dotenv from 'dotenv';
import { resolve } from 'node:path';

export function configureTestEnvironment(): void {
  dotenv.config({ path: resolve(process.cwd(), '.env') });
  dotenv.config({
    path: resolve(process.cwd(), '.env.test'),
    override: true,
  });

  const testDatabaseUrl = process.env.TEST_DATABASE_URL;
  if (!testDatabaseUrl) {
    throw new Error(
      'TEST_DATABASE_URL is required. Copy .env.test.example to .env.test and set a dedicated test database.',
    );
  }

  const testDatabase = new URL(testDatabaseUrl);

  if (
    process.env.KANBAN_TEST_DATABASE_READY === 'true' &&
    process.env.DATABASE_URL === testDatabaseUrl
  ) {
    process.env.DIRECT_URL = testDatabaseUrl;
    return;
  }

  const applicationDatabaseUrl = process.env.DATABASE_URL;
  if (
    applicationDatabaseUrl &&
    new URL(applicationDatabaseUrl).pathname === testDatabase.pathname
  ) {
    throw new Error(
      'TEST_DATABASE_URL must use a different database name from DATABASE_URL.',
    );
  }

  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DIRECT_URL = testDatabaseUrl;
  process.env.KANBAN_TEST_DATABASE_READY = 'true';
}
