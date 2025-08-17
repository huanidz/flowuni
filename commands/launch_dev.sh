#!/bin/bash

set -e  # Exit on any error

# Project name used in docker compose
PROJECT_NAME="flowuni"
COMPOSE_FILE="docker/docker-compose.dev.yml"

echo "🚀 Starting fresh Docker Compose build..."
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up --build -d

echo "🧹 Cleaning Celery result tables..."
# Wait for database to be ready
sleep 5

# Clean celery tables
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec db_service psql -U postgres -d flowuni-celery-backend-db -c "
TRUNCATE celery_taskmeta, celery_tasksetmeta RESTART IDENTITY CASCADE;
"

echo "✅ Celery tables cleaned. Restarting celery worker..."
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart celery-worker

# Bring containers to foreground
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f