#!/bin/bash
set -e

PROJECT_NAME="flowuni-redis"
COMPOSE_FILE="docker/docker-compose.redis.yml"
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "=================================================="
echo "🚀 Deploying Redis stack for: $PROJECT_NAME"
echo "📂 Working directory: $APP_DIR"
echo "=================================================="

cd "$APP_DIR"

# Start or update Redis stack
echo "🔧 Starting Redis service..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

echo "=================================================="
echo "✅ Redis stack is running!"
echo "=================================================="

# Show container status
docker ps --filter "name=${PROJECT_NAME}"
