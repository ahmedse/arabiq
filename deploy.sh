#!/bin/bash
set -e

# Production deployment script for Arabiq
# Deploys to server: ahmed@72.60.33.37:/srv/arabiq

SERVER="ahmed@72.60.33.37"
REMOTE_PATH="/srv/arabiq"

echo "Building Docker images locally..."

# Build web image
docker build -t arabiq-web:latest ./apps/web

# Build CMS image
docker build -t arabiq-cms:latest ./apps/cms

echo "Saving images to tar files..."
docker save arabiq-web:latest > arabiq-web.tar
docker save arabiq-cms:latest > arabiq-cms.tar

echo "Copying images and config to server..."
scp arabiq-web.tar arabiq-cms.tar docker-compose.yml .env $SERVER:$REMOTE_PATH/

echo "Loading images on server..."
ssh $SERVER "cd $REMOTE_PATH && docker load < arabiq-web.tar"
ssh $SERVER "cd $REMOTE_PATH && docker load < arabiq-cms.tar"

echo "Starting services on server..."
ssh $SERVER "cd $REMOTE_PATH && docker-compose up -d"

echo "Cleaning up local tar files..."
rm arabiq-web.tar arabiq-cms.tar

echo "Deployment complete!"
echo "Web app: https://arabiq.tech"
echo "CMS: https://arabiq.tech/cms-admin (assuming Nginx proxy)"