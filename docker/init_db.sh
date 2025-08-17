
#!/bin/sh
set -e

echo "🗄️  Checking if main DB exists: $POSTGRES_DB"
DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" = "1" ]; then
  echo "✅ Database $POSTGRES_DB already exists"
else
  echo "📝 Creating database $POSTGRES_DB"
  createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
fi

echo "🧹 Clearing all Celery data for fresh development start..."

# Drop and recreate the entire Celery database for clean slate
echo "🗑️  Dropping Celery database: $CELERY_BACKEND_RESULT_DB"
dropdb -U "$POSTGRES_USER" "$CELERY_BACKEND_RESULT_DB" --if-exists

echo "📝 Creating fresh Celery database: $CELERY_BACKEND_RESULT_DB"
createdb -U "$POSTGRES_USER" "$CELERY_BACKEND_RESULT_DB"

echo "✨ Development database setup completed - all Celery data cleared!"