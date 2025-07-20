#!/bin/sh
set -e

echo "Checking if DB exists: $CELERY_BACKEND_RESULT_DB"

DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname = '$CELERY_BACKEND_RESULT_DB'")

if [ "$DB_EXISTS" = "1" ]; then
  echo "Database $CELERY_BACKEND_RESULT_DB already exists"
else
  echo "Creating database $CELERY_BACKEND_RESULT_DB"
  createdb -U "$POSTGRES_USER" "$CELERY_BACKEND_RESULT_DB"
fi