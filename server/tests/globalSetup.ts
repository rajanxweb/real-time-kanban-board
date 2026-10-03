import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { configureTestEnvironment } from './testEnvironment.js';

export default function setup(): void {
  configureTestEnvironment();

  const prismaCli = resolve(
    process.cwd(),
    'node_modules',
    'prisma',
    'build',
    'index.js',
  );
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
}
