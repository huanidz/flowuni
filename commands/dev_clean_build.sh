#!/bin/bash

set -e  # Exit on any error

# Project name used in docker compose
PROJECT_NAME="flowuni"
COMPOSE_FILE="docker/docker-compose.dev.yml"

echo "🔻 Stopping and removing existing containers, networks, and volumes..."
# The 'down' command removes containers and networks.
# The '-v' flag ensures volumes created by 'up' are also removed.
# Added '|| true' to prevent script exit if a network removal fails (e.g., resource still in use).
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v || true

echo "🧹 Removing local data directories..."
sudo rm -rf ./docker/redis_data/
sudo rm -rf ./docker/postgres_data/
sudo rm -rf ./docker/celery_postgres_data/
sudo rm -rf ./docker/redisinsight_data/
sudo rm -rf ./docker/logs/

echo "🗑 Removing named Docker volumes..."
# This targets a specific named volume for extra cleanup robustness
docker volume rm "${PROJECT_NAME}_postgres_data" 2>/dev/null || true

echo "🚀 Starting fresh Docker Compose build..."
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up --build
