#!/bin/bash
set -e

PROJECT_NAME="flowuni-db"
COMPOSE_FILE="docker/docker-compose.db.yml"
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "=================================================="
echo "🚀 Deploying Database stack for: $PROJECT_NAME"
echo "📂 Working directory: $APP_DIR"
echo "=================================================="

cd "$APP_DIR"

# Start or update DB stack
echo "🔧 Starting Postgres service..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

echo "=================================================="
echo "✅ Database stack is running!"
echo "=================================================="

# Show container status
docker ps --filter "name=${PROJECT_NAME}"
