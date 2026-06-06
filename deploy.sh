#!/bin/bash
# TrustEscrow NG - Deployment Helper Script
# Run: bash deploy.sh

set -e  # Exit on error

echo "=========================================="
echo "TrustEscrow NG - Deployment Guide"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    brew install railway
else
    echo "✅ Railway CLI installed: $(railway --version)"
fi

echo ""
echo "=========================================="
echo "STEP 1: Login to Railway"
echo "=========================================="
echo ""
echo "Running: railway login"
echo "This will open your browser..."
echo ""
read -p "Press Enter to continue..."

railway login

echo ""
echo "=========================================="
echo "STEP 2: Initialize Railway Project"
echo "=========================================="
echo ""
echo "Running: railway init"
echo ""
read -p "Press Enter to continue..."

railway init

echo ""
echo "=========================================="
echo "STEP 3: Add PostgreSQL Database"
echo "=========================================="
echo ""
echo "Running: railway add --database postgres"
echo ""
read -p "Press Enter to continue..."

railway add --database postgres

echo ""
echo "=========================================="
echo "STEP 4: Set Environment Variables"
echo "=========================================="
echo ""
echo "Opening Railway dashboard..."
echo ""
echo "📋 INSTRUCTIONS:"
echo "1. Click on your service"
echo "2. Go to 'Variables' tab"
echo "3. Click 'Raw Editor' button"
echo "4. Copy ALL content from: railway-env-template.txt"
echo "5. Paste into Raw Editor"
echo "6. Click 'Save'"
echo ""
echo "⚠️  IMPORTANT: You'll need to:"
echo "   - Create Upstash Redis and update REDIS_URL"
echo "   - Update APP_URL after first deployment"
echo "   - Update ADMIN_CORS_ORIGIN after Vercel deployment"
echo ""
read -p "Press Enter to open Railway dashboard..."

railway open

echo ""
echo "Have you set all environment variables?"
read -p "Press Enter when done to continue..."

echo ""
echo "=========================================="
echo "STEP 5: Deploy to Railway"
echo "=========================================="
echo ""
echo "Running: railway up"
echo "This will take 5-10 minutes..."
echo ""
read -p "Press Enter to start deployment..."

railway up

echo ""
echo "=========================================="
echo "STEP 6: Get Your Railway URL"
echo "=========================================="
echo ""
echo "Running: railway status"
echo ""

railway status

echo ""
echo "📋 ACTION REQUIRED:"
echo "1. Copy your Railway URL from above"
echo "2. Update APP_URL in Railway Variables"
echo "3. Update in the command below and run:"
echo ""
echo "   railway variables set APP_URL=\"https://YOUR-RAILWAY-URL\""
echo ""
read -p "Press Enter when you've updated APP_URL..."

echo ""
echo "=========================================="
echo "STEP 7: Test API Health"
echo "=========================================="
echo ""
read -p "Enter your Railway URL (without https://): " railway_url
echo ""
echo "Testing: https://$railway_url/health"
echo ""

curl -s "https://$railway_url/health" | jq '.' || echo "Failed to connect. Check logs: railway logs"

echo ""
echo "=========================================="
echo "✅ API Deployment Complete!"
echo "=========================================="
echo ""
echo "Your API is live at: https://$railway_url"
echo ""
echo "Next: Deploy Admin Dashboard to Vercel"
echo "Run: cd apps/admin && vercel --prod"
echo ""
echo "See DEPLOY_NOW.md for detailed instructions"
echo ""
