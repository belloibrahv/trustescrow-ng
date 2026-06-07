#!/bin/bash
# TrustEscrow NG - Automated Deployment Script
# Using Development Credentials Until Production Ready
# Run: bash deploy-now.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/Users/kudiratbello/trustescrow-ng"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  TrustEscrow NG - Deployment Automation"
echo "  Using Development Credentials"
echo "════════════════════════════════════════════════════════"
echo ""

# ============================================================
# Step 0: Pre-flight Checks
# ============================================================
echo -e "${BLUE}[Step 0]${NC} Running pre-flight checks..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js 20+ required. Current: $(node -v)${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
fi

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install: brew install railway"
    exit 1
else
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
fi

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install: npm install -g vercel"
    exit 1
else
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
fi

echo ""
echo -e "${GREEN}All pre-flight checks passed!${NC}"
echo ""

# ============================================================
# Step 1: Setup Instructions
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 1]${NC} Setup Upstash Redis"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Before we continue, you need to create a Redis database:"
echo ""
echo "1. Go to: https://upstash.com"
echo "2. Sign up / Login with GitHub"
echo "3. Click 'Create Database'"
echo "4. Configure:"
echo "   - Name: trustescrow-redis-dev"
echo "   - Type: Regional"
echo "   - Region: Choose closest to you"
echo "   - TLS: Enabled"
echo "5. Copy the Redis URL (starts with rediss://)"
echo ""
echo -e "${YELLOW}⚠️  Have you created your Upstash Redis database?${NC}"
read -p "Press Enter when ready to continue..."
echo ""
read -p "Enter your Upstash Redis URL: " REDIS_URL
echo ""

if [ -z "$REDIS_URL" ]; then
    echo -e "${RED}❌ Redis URL is required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Redis URL saved${NC}"
echo ""

# ============================================================
# Step 2: Railway Login
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 2]${NC} Railway Authentication"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Opening browser for Railway login..."
echo ""

cd "$PROJECT_ROOT"
railway login

echo ""
echo -e "${GREEN}✅ Railway authentication complete${NC}"
echo ""

# ============================================================
# Step 3: Initialize Railway Project
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 3]${NC} Initialize Railway Project"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Creating new Railway project..."
echo ""
echo "When prompted:"
echo "  - Project name: trustescrow-ng-dev"
echo "  - Environment: production"
echo ""
read -p "Press Enter to continue..."

railway init

echo ""
echo -e "${GREEN}✅ Railway project initialized${NC}"
echo ""

# ============================================================
# Step 4: Add PostgreSQL
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 4]${NC} Add PostgreSQL Database"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Adding PostgreSQL to your Railway project..."
echo ""

railway add --database postgres

echo ""
echo -e "${GREEN}✅ PostgreSQL database added${NC}"
echo ""

# ============================================================
# Step 5: Set Environment Variables
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 5]${NC} Configure Environment Variables"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Setting environment variables..."
echo ""

# Set environment variables one by one
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=info

# Security
railway variables set ADMIN_JWT_SECRET=5dcd6b12614b43103d54f8b822dfa51fe3cff8c52bf8390e604e7cbd6d7acd5f
railway variables set 'ADMIN_USERS={"admin":"admin123","operator":"operator456"}'
railway variables set ADMIN_DEFAULT_PASSWORD=admin123
railway variables set ENCRYPTION_KEY=350498d24b8d2ac5de614a99f970574b2d5a984bdec0ff60a4fb50fe19f07231
railway variables set NIN_SALT=bbdbd612afc6d0b96b010df02e0afcce

# Redis
railway variables set REDIS_URL="$REDIS_URL"

# Africa's Talking (Sandbox)
railway variables set AT_USERNAME=sandbox
railway variables set AT_API_KEY=atsk_a79f6c8a24a0eaa90fd9e44688a498bf4304eecf34a4673096f831eef6236d01b55346c9
railway variables set AT_SHORTCODE=96207
railway variables set AT_SENDER_ID=TRUSTESCROW

# Paystack (Test Mode)
railway variables set PAYSTACK_SECRET_KEY=sk_test_37780b726b59580bca6a7084a5424622aa7054f7
railway variables set PAYSTACK_PUBLIC_KEY=pk_test_ec5ed34324eb8df91a9f02c494da3efb9ca01699
railway variables set PAYSTACK_WEBHOOK_SECRET=sk_test_37780b726b59580bca6a7084a5424622aa7054f7
railway variables set PAYSTACK_DVA_PROVIDER=wema-bank

# Prembly (Sandbox)
railway variables set PREMBLY_API_KEY=live_sk_2c9575f35064468ab1a056903afa02bc
railway variables set PREMBLY_APP_ID=sandbox_xxxxxxxx
railway variables set PREMBLY_BASE_URL=https://sandbox.prembly.com

# AI Provider (GROQ)
railway variables set AI_PROVIDER=groq
railway variables set AI_MODEL=llama-3.3-70b-groq
railway variables set GROQ_API_KEY=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

# GitHub Models (Fallback)
railway variables set GITHUB_TOKEN=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

# DeepSeek (Alternative)
railway variables set DEEPSEEK_API_KEY=sk-0265edcd2d494e6f8eaa997075321995

# Feature Flags
railway variables set USE_MOCK_NIN=false
railway variables set USE_MOCK_PAYSTACK=false
railway variables set LIVENESS_THRESHOLD_KOBO=50000000
railway variables set DVA_EXPIRY_DAYS=7
railway variables set DISPUTE_AUTO_ESCALATE_HOURS=48
railway variables set MAX_NIN_ATTEMPTS=3
railway variables set DEAL_VALUE_CAP_KOBO=0

echo ""
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""
echo -e "${YELLOW}Note: APP_URL and ADMIN_CORS_ORIGIN will be set after deployment${NC}"
echo ""

# ============================================================
# Step 6: Deploy API to Railway
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 6]${NC} Deploy API to Railway"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Starting deployment..."
echo "This will take 5-10 minutes..."
echo ""
read -p "Press Enter to start deployment..."

railway up

echo ""
echo -e "${GREEN}✅ API deployed to Railway${NC}"
echo ""

# ============================================================
# Step 7: Get Railway URL and Update
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 7]${NC} Configure Railway URL"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Getting deployment information..."
echo ""

railway status

echo ""
echo "Copy your Railway URL from above"
echo "Example: trustescrow-ng-dev.up.railway.app"
echo ""
read -p "Enter your Railway URL (without https://): " RAILWAY_URL
echo ""

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${RED}❌ Railway URL is required${NC}"
    exit 1
fi

# Update APP_URL
railway variables set APP_URL="https://$RAILWAY_URL"

echo ""
echo -e "${GREEN}✅ APP_URL configured: https://$RAILWAY_URL${NC}"
echo ""

# ============================================================
# Step 8: Test API Health
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 8]${NC} Test API Health"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Testing API health endpoint..."
echo ""
sleep 5  # Wait for deployment to settle

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$RAILWAY_URL/health")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ API is healthy!${NC}"
    echo ""
    curl -s "https://$RAILWAY_URL/health" | jq '.' || echo ""
else
    echo -e "${RED}❌ API health check failed (HTTP $HTTP_STATUS)${NC}"
    echo "Check logs: railway logs"
    echo ""
    echo "Common issues:"
    echo "  - Database connection failed"
    echo "  - Redis connection failed"
    echo "  - Build errors"
    echo ""
    read -p "Check logs and press Enter to continue anyway..."
fi

echo ""

# ============================================================
# Step 9: Deploy Admin to Vercel
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 9]${NC} Deploy Admin Dashboard to Vercel"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Logging into Vercel..."
echo ""

vercel login

echo ""
echo "Deploying admin dashboard..."
echo ""
cd "$PROJECT_ROOT/apps/admin"

echo "When prompted:"
echo "  - Set up and deploy? Yes"
echo "  - Which scope? (Select your account)"
echo "  - Link to existing project? No"
echo "  - Project name: trustescrow-admin-dev"
echo "  - Directory: ./"
echo "  - Override settings? No"
echo ""
read -p "Press Enter to continue..."

vercel --prod

echo ""
echo -e "${GREEN}✅ Admin dashboard deployed${NC}"
echo ""

# ============================================================
# Step 10: Configure Admin Environment
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 10]${NC} Configure Admin Environment"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Setting API URL for admin dashboard..."
echo ""

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production --yes -- "https://$RAILWAY_URL" || true

# Redeploy with environment variable
echo "Redeploying with environment variable..."
vercel --prod

echo ""
echo -e "${GREEN}✅ Admin environment configured${NC}"
echo ""

# Get Vercel URL
echo "Your Vercel deployment URL should be displayed above"
echo "Example: trustescrow-admin-dev.vercel.app"
echo ""
read -p "Enter your Vercel URL (without https://): " VERCEL_URL
echo ""

if [ -z "$VERCEL_URL" ]; then
    echo -e "${RED}❌ Vercel URL is required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin URL: https://$VERCEL_URL${NC}"
echo ""

# ============================================================
# Step 11: Update CORS
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${BLUE}[Step 11]${NC} Update CORS Configuration"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Setting CORS origin in Railway..."
echo ""

cd "$PROJECT_ROOT"
railway variables set ADMIN_CORS_ORIGIN="https://$VERCEL_URL"

echo ""
echo -e "${GREEN}✅ CORS configured${NC}"
echo ""
echo "Note: Changes will take effect on next deployment"
echo "Railway may auto-redeploy, or you can trigger manually: railway up"
echo ""

# ============================================================
# Step 12: Summary
# ============================================================
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}  🎉 Deployment Complete!${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Your TrustEscrow NG platform is now deployed!"
echo ""
echo -e "${BLUE}URLs:${NC}"
echo "  📡 API: https://$RAILWAY_URL"
echo "  🖥️  Admin: https://$VERCEL_URL"
echo ""
echo -e "${BLUE}Test it:${NC}"
echo "  1. Open: https://$VERCEL_URL"
echo "  2. Login: admin / admin123"
echo "  3. View dashboard metrics"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Test API health: curl https://$RAILWAY_URL/health"
echo "  2. Login to admin dashboard"
echo "  3. Configure webhooks:"
echo "     - Paystack: https://$RAILWAY_URL/api/webhooks/paystack"
echo "     - Africa's Talking: https://$RAILWAY_URL/api/sms/inbound"
echo "  4. Test SMS flow"
echo "  5. Monitor logs: railway logs --tail"
echo ""
echo -e "${BLUE}Dashboards:${NC}"
echo "  Railway: https://railway.app/dashboard"
echo "  Vercel: https://vercel.com/dashboard"
echo "  Upstash: https://console.upstash.com"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  Full guide: DEPLOY_WITH_DEV_CREDENTIALS.md"
echo "  Troubleshooting: Check Railway logs"
echo ""
echo -e "${YELLOW}⚠️  Using Development Credentials${NC}"
echo "  - Africa's Talking: Sandbox mode"
echo "  - Paystack: Test mode"
echo "  - Switch to production credentials when ready"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# Save deployment info
cat > "$PROJECT_ROOT/DEPLOYMENT_INFO.txt" << EOF
TrustEscrow NG - Deployment Information
Deployed: $(date)

API Server (Railway)
  URL: https://$RAILWAY_URL
  Health: https://$RAILWAY_URL/health
  Dashboard: https://railway.app/dashboard

Admin Dashboard (Vercel)
  URL: https://$VERCEL_URL
  Dashboard: https://vercel.com/dashboard

Redis (Upstash)
  URL: $REDIS_URL
  Dashboard: https://console.upstash.com

Webhook URLs
  Paystack: https://$RAILWAY_URL/api/webhooks/paystack
  Africa's Talking: https://$RAILWAY_URL/api/sms/inbound

Admin Credentials (DEV)
  Username: admin
  Password: admin123

Status: Using Development Credentials
EOF

echo -e "${GREEN}✅ Deployment info saved to: DEPLOYMENT_INFO.txt${NC}"
echo ""
echo "Happy deploying! 🚀"
echo ""
