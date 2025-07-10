#!/bin/bash

# Set script to exit on any errors
set -e

# Define your compose file and project name
COMPOSE_FILE=docker-compose.dev.yml
PROJECT_NAME=flowuni

echo "Stopping and removing all containers, networks, and volumes for project '$PROJECT_NAME'..."
docker compose -f $COMPOSE_FILE -p $PROJECT_NAME down --volumes --remove-orphans

echo "Remove mounted volumes for project '$PROJECT_NAME'..."
sudo rm -rf ./postgres_data/

echo "Rebuilding and starting up services..."
docker compose -f $COMPOSE_FILE -p $PROJECT_NAME up --build

