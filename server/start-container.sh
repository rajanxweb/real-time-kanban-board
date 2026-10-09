#!/bin/sh
set -eu

if [ -z "${JWT_SECRET:-}" ]; then
  JWT_SECRET="$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
  export JWT_SECRET
fi

npx prisma migrate deploy
exec node dist/index.js
