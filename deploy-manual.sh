#!/bin/bash

# Manual deployment script for VidyaAI
# Use this if Cloud Build triggers are not working

# Set your project ID (replace with your actual project ID)
PROJECT_ID="your-project-id"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting manual deployment...${NC}"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo -e "${RED}❌ Please authenticate with gcloud first:${NC}"
    echo "gcloud auth login"
    exit 1
fi

# Check if project ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${RED}❌ Please set your PROJECT_ID in this script${NC}"
    exit 1
fi

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build --platform linux/amd64 -f Dockerfile -t gcr.io/$PROJECT_ID/vidya-ai .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

# Push the image
echo -e "${YELLOW}☁️ Pushing image to Google Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/vidya-ai

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy vidya-ai \
  --image gcr.io/$PROJECT_ID/vidya-ai \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Your app should now be updated with the latest changes${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment completed! Check your Cloud Run URL for the updates.${NC}"