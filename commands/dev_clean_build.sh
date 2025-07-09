#!/bin/bash

set -e  # Exit on any error

# Project name used in docker compose
PROJECT_NAME="flowuni"
COMPOSE_FILE="docker/docker-compose.dev.yml"

echo "🔻 Stopping and removing existing containers and volumes..."
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v

echo "🧹 Removing local data directories..."
sudo rm -rf ./docker/redis_data/
sudo rm -rf ./docker/postgres_data/
sudo rm -rf ./docker/logs/

echo "🗑 Removing named Docker volumes..."
docker volume rm "${PROJECT_NAME}_postgres_data" 2>/dev/null || true

echo "🚀 Starting fresh Docker Compose build..."
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up --build
