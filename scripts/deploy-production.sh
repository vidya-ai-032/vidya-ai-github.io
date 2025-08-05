#!/bin/bash

# VidyaAI Production Deployment Script
# This script helps deploy to Google Cloud Run with proper environment variables

echo "🚀 Starting VidyaAI Production Deployment..."

# Check if required environment variables are set locally
echo "📋 Checking local environment variables..."

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ GOOGLE_CLIENT_ID is not set"
    echo "Please set it to: 612152786911-hkm08b2t0k15rg8mn7sod3fga3mcmk2a.apps.googleusercontent.com"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ GOOGLE_CLIENT_SECRET is not set"
    echo "Please set it to: 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"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET is not set"
    echo "Please set it to: 3IT0aGPyJY6MjQKc6v8dHewXub3fnB4/22PnX2pnlHo="
    exit 1
fi

if [ -z "$GOOGLE_GEMINI_API_KEY" ]; then
    echo "❌ GOOGLE_GEMINI_API_KEY is not set"
    echo "Please set it to: AIzaSyAnRcGUdStW3QCjmR_nfr7ygvt8yBYwu-M"
    exit 1
fi

echo "✅ All environment variables are set locally"

# Get the Cloud Run service URL
echo "🔍 Getting Cloud Run service URL..."
SERVICE_URL=$(gcloud run services describe vidya-ai --platform managed --region us-central1 --format="value(status.url)" 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
    echo "❌ Could not find Cloud Run service 'vidya-ai'"
    echo "Please make sure the service exists and you have the correct permissions"
    exit 1
fi

echo "📍 Service URL: $SERVICE_URL"

# Set NEXTAUTH_URL
export NEXTAUTH_URL="$SERVICE_URL"

echo "🔧 Building and deploying..."

# Build and deploy
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/vidya-ai

# Deploy to Cloud Run with environment variables
gcloud run deploy vidya-ai \
  --image gcr.io/$GOOGLE_CLOUD_PROJECT/vidya-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" \
  --set-env-vars="GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" \
  --set-env-vars="NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
  --set-env-vars="NEXTAUTH_URL=$NEXTAUTH_URL" \
  --set-env-vars="GOOGLE_GEMINI_API_KEY=$GOOGLE_GEMINI_API_KEY"

echo "✅ Deployment completed!"
echo "🌐 Your application is available at: $SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Test authentication at: $SERVICE_URL/auth/login"
echo "2. Test document upload and processing"
echo "3. Check logs for any issues: gcloud logging read 'resource.type=cloud_run_revision' --limit=20" 