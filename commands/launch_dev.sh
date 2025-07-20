#!/bin/bash

set -e  # Exit on any error

# Project name used in docker compose
PROJECT_NAME="flowuni"
COMPOSE_FILE="docker/docker-compose.dev.yml"

echo "🚀 Starting fresh Docker Compose build..."
sudo docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up --build

