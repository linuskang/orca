#!/bin/sh
set -e

# Run database migrations when a DATABASE_URL is provided.
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  cd /app/packages/db
  prisma migrate deploy || echo "Migration step skipped/failed, continuing..."
  cd /app
fi

echo "Starting server..."
exec node /app/apps/web/server.js