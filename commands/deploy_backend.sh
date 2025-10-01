#!/bin/bash
set -e

PROJECT_NAME="flowuni"
COMPOSE_FILE="docker/docker-compose.prod.yml"
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

echo "=================================================="
echo "🚀 Deploying Backend for project: $PROJECT_NAME"
echo "📂 Working directory: $APP_DIR"
echo "=================================================="

cd "$APP_DIR"

echo "📥 Pulling latest code from main..."
# git fetch origin main
# git reset --hard origin/main

echo "🔧 Building and restarting backend & worker services..."
docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d --build app celery-worker

echo "🧹 Cleaning up unused images..."
docker image prune -f

echo "=================================================="
echo "✅ Backend deployment finished!"
echo "=================================================="
