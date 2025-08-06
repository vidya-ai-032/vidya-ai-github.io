#!/bin/bash

# Manual deployment script for VidyaAI
# Use this if Cloud Build triggers are not working
# Updated with sidebar improvements

# Set your project ID (replace with your actual project ID)
PROJECT_ID="your-project-id"
SERVICE_NAME="vidya-ai"
REGION="us-central1"  # Update with your region

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 VidyaAI Manual Deployment Script${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "${YELLOW}📋 This will deploy the latest sidebar improvements:${NC}"
echo -e "   • Collapse toggle moved to top-right corner"
echo -e "   • Sign-out button removed from sidebar"
echo -e "   • Cleaner sidebar layout and improved UX"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo -e "${RED}❌ Please authenticate with gcloud first:${NC}"
    echo "gcloud auth login"
    exit 1
fi

# Check if project ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${RED}❌ Please set your PROJECT_ID in this script${NC}"
    echo "Update the PROJECT_ID variable in deploy-manual.sh"
    exit 1
fi

# Set the project
echo -e "${YELLOW}🔧 Setting project to $PROJECT_ID...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs (if not already enabled)
echo -e "${YELLOW}🔌 Ensuring required APIs are enabled...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build --platform linux/amd64 -f Dockerfile -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

# Push the image
echo -e "${YELLOW}☁️ Pushing image to Google Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker push failed${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --port 8080

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Getting service URL...${NC}"
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}📱 Your app is now live at: ${BLUE}$SERVICE_URL${NC}"
    echo ""
    echo -e "${YELLOW}🔍 What to test:${NC}"
    echo -e "   • Sidebar collapse toggle is now in top-right corner"
    echo -e "   • No more sign-out button at bottom of sidebar"
    echo -e "   • Sign-out still available in the header menu"
    echo -e "   • Improved sidebar layout and animations"
    echo ""
    echo -e "${YELLOW}💡 Tip: Hard refresh (Ctrl+F5) to see changes immediately${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi