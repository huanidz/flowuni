#!/bin/bash
set -e

CONTAINER="flowuni-db"
DB_USER="postgres"
DB_NAME="yourdbname"
BACKUP_DIR="./docker/db_backups"

mkdir -p $BACKUP_DIR
FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Backing up database $DB_NAME from container $CONTAINER..."
docker exec -t $CONTAINER pg_dump -U $DB_USER $DB_NAME > $FILE

echo "✅ Backup saved to $FILE"
