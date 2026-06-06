# TrustEscrow NG — Complete Deployment Guide

**Last Updated**: June 5, 2026  
**Platform Status**: Ready for Production 🚀

---

## 📋 Deployment Overview

### Infrastructure Stack

| Component | Platform | URL After Deployment |
|-----------|----------|---------------------|
| **API Server** | Railway | `https://trustescrow-ng-production.up.railway.app` |
| **Admin Dashboard** | Vercel | `https://trustescrow-admin.vercel.app` |
| **Database** | Railway PostgreSQL | Internal Railway URL |
| **Redis** | Upstash | External Redis URL |

---

## 🎯 Pre-Deployment Checklist

### 1. Code Preparation ✅
- [x] All features implemented
- [x] React optimization complete
- [x] Tests passing
- [x] No console errors
- [x] Environment variables documented

### 2. Secrets Preparation (CRITICAL)
- [ ] Generate strong admin passwords
- [ ] Generate JWT secret (256-bit)
- [ ] Generate encryption key (32 bytes)
- [ ] Generate NIN salt
- [ ] Collect all API keys

### 3. Third-Party Accounts
- [ ] Railway account created
- [ ] Vercel account created
- [ ] Upstash account (Redis)
- [ ] Africa's Talking live credentials
- [ ] Paystack live credentials
- [ ] Prembly live credentials
- [ ] Anthropic API key (or alternative AI provider)
- [ ] Sentry account (optional but recommended)

---

## 🚀 PART 1: Deploy API to Railway

### Step 1: Install Railway CLI

```bash
# macOS
brew install railway

# Or using npm
npm install -g @railway/cli

# Verify installation
railway --version
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### Step 3: Create New Railway Project

```bash
# Navigate to project root
cd /Users/kudiratbello/trustescrow-ng

# Initialize Railway project
railway init

# Follow prompts:
# - Project name: trustescrow-ng-production
# - Environment: production
```

### Step 4: Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add --database postgres

# Railway will automatically create DATABASE_URL
```

### Step 5: Add Redis (Upstash)

**Option A: Using Railway Plugin**
```bash
railway add --plugin upstash-redis
```

**Option B: External Upstash (Recommended for better control)**

1. Go to [https://upstash.com](https://upstash.com)
2. Create account and new Redis database
3. Choose region: Europe (Ireland) or US East
4. Copy the Redis URL
5. Add to Railway environment variables

### Step 6: Set Environment Variables

```bash
# Open Railway dashboard
railway open

# Or set via CLI
railway variables set NODE_ENV=production
railway variables set PORT=3000

# Set all required variables (see template below)
```

### Environment Variables Template for Railway

```bash
# ─────────────────────────────────────────────────────
# SERVER CONFIGURATION
# ─────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
APP_URL=https://trustescrow-ng-production.up.railway.app

# CRITICAL: Generate strong secrets
ADMIN_JWT_SECRET=<GENERATE_256_BIT_SECRET>
ENCRYPTION_KEY=<GENERATE_32_BYTE_KEY>
NIN_SALT=<GENERATE_RANDOM_STRING>

# Admin users (CHANGE DEFAULT PASSWORDS!)
ADMIN_USERS=[{"username":"admin","password":"<STRONG_PASSWORD>","role":"super_admin"},{"username":"operator","password":"<STRONG_PASSWORD>","role":"admin"}]

# ─────────────────────────────────────────────────────
# DATABASE (Auto-set by Railway PostgreSQL)
# ─────────────────────────────────────────────────────
DATABASE_URL=${{Postgres.DATABASE_URL}}

# ─────────────────────────────────────────────────────
# REDIS (Set from Upstash)
# ─────────────────────────────────────────────────────
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379

# ─────────────────────────────────────────────────────
# AFRICA'S TALKING — LIVE CREDENTIALS
# Get from: https://account.africastalking.com/
# ─────────────────────────────────────────────────────
AT_USERNAME=TrustEscrowNG
AT_API_KEY=<YOUR_LIVE_AT_API_KEY>
AT_SHORTCODE=<YOUR_SHORTCODE>
AT_SENDER_ID=TRUSTESCROW

# ─────────────────────────────────────────────────────
# PAYSTACK — LIVE CREDENTIALS
# Get from: https://dashboard.paystack.com/#/settings/developer
# ─────────────────────────────────────────────────────
PAYSTACK_SECRET_KEY=sk_live_<YOUR_KEY>
PAYSTACK_PUBLIC_KEY=pk_live_<YOUR_KEY>
PAYSTACK_WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>
PAYSTACK_DVA_PROVIDER=wema-bank

# ─────────────────────────────────────────────────────
# PREMBLY IDENTITYPASS — LIVE CREDENTIALS
# Get from: https://dashboard.prembly.com
# ─────────────────────────────────────────────────────
PREMBLY_API_KEY=<YOUR_LIVE_KEY>
PREMBLY_APP_ID=<YOUR_APP_ID>
PREMBLY_BASE_URL=https://api.prembly.com

# ─────────────────────────────────────────────────────
# AI PROVIDER — ANTHROPIC CLAUDE (or alternatives)
# Get from: https://console.anthropic.com
# ─────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-<YOUR_KEY>
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_MAX_TOKENS=1024

# Or use alternative providers:
# GITHUB_TOKEN=<YOUR_GITHUB_TOKEN>
# GROQ_API_KEY=<YOUR_GROQ_KEY>
# DEEPSEEK_API_KEY=<YOUR_DEEPSEEK_KEY>

# ─────────────────────────────────────────────────────
# TWILIO FALLBACK (Optional but recommended)
# Get from: https://www.twilio.com/console
# ─────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=<YOUR_SID>
TWILIO_AUTH_TOKEN=<YOUR_TOKEN>
TWILIO_FROM_NUMBER=+234XXXXXXXXXX

# ─────────────────────────────────────────────────────
# MONITORING (Optional but highly recommended)
# Get from: https://sentry.io
# ─────────────────────────────────────────────────────
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>

# ─────────────────────────────────────────────────────
# FEATURE FLAGS
# ─────────────────────────────────────────────────────
USE_MOCK_NIN=false
USE_MOCK_PAYSTACK=false
LIVENESS_THRESHOLD=500000
DVA_EXPIRY_DAYS=7
DISPUTE_AUTO_ESCALATE_HOURS=48
MAX_NIN_ATTEMPTS=3

# ─────────────────────────────────────────────────────
# CORS (Set after deploying admin dashboard)
# ─────────────────────────────────────────────────────
ADMIN_CORS_ORIGIN=https://trustescrow-admin.vercel.app
```

### Step 7: Deploy to Railway

```bash
# From project root
railway up

# Railway will:
# 1. Build Docker image
# 2. Run database migrations
# 3. Start the server
# 4. Provide a public URL
```

### Step 8: Verify API Deployment

```bash
# Check health endpoint
curl https://trustescrow-ng-production.up.railway.app/health

# Expected response:
# {"status":"ok","db":"connected","time":"2026-06-05T..."}
```

### Step 9: Configure Custom Domain (Optional)

In Railway dashboard:
1. Go to Settings → Domains
2. Add custom domain: `api.trustescrow.ng`
3. Add CNAME record in your DNS:
   - Name: `api`
   - Value: `<your-railway-url>.railway.app`
   - TTL: 300

---

## 🎨 PART 2: Deploy Admin Dashboard to Vercel

### Step 1: Install Vercel CLI

```bash
# Install globally
npm install -g vercel

# Verify installation
vercel --version
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Configure Admin for Production

Update the API URL in admin:

```bash
cd apps/admin

# Create production env file (not committed to git)
cat > .env.production.local << EOF
NEXT_PUBLIC_API_URL=https://trustescrow-ng-production.up.railway.app
EOF
```

### Step 4: Deploy to Vercel

```bash
# From apps/admin directory
cd apps/admin

# Deploy to production
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: trustescrow-admin
# - Directory: ./
# - Override settings? No
```

### Step 5: Set Environment Variables in Vercel

```bash
# Set via CLI
vercel env add NEXT_PUBLIC_API_URL production

# Or via Vercel Dashboard:
# 1. Go to project settings
# 2. Environment Variables
# 3. Add: NEXT_PUBLIC_API_URL = https://trustescrow-ng-production.up.railway.app
```

### Step 6: Redeploy with Environment Variables

```bash
vercel --prod
```

### Step 7: Verify Admin Deployment

Open your browser:
```
https://trustescrow-admin.vercel.app
```

Test login with your credentials.

### Step 8: Configure Custom Domain (Optional)

In Vercel dashboard:
1. Go to Settings → Domains
2. Add domain: `admin.trustescrow.ng`
3. Add CNAME record in DNS:
   - Name: `admin`
   - Value: `cname.vercel-dns.com`
   - TTL: 300

---

## 🔄 PART 3: Update CORS After Deployment

After both deployments, update Railway environment:

```bash
railway variables set ADMIN_CORS_ORIGIN=https://trustescrow-admin.vercel.app
```

Or in Railway dashboard, update `ADMIN_CORS_ORIGIN` to your Vercel URL.

Redeploy:
```bash
railway up
```

---

## 📊 PART 4: Post-Deployment Verification

### API Health Checks

```bash
# 1. Health endpoint
curl https://trustescrow-ng-production.up.railway.app/health

# 2. Admin metrics (requires auth)
curl -X POST https://trustescrow-ng-production.up.railway.app/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'

# Copy the token from response
export TOKEN="<your-jwt-token>"

# 3. Test authenticated endpoint
curl https://trustescrow-ng-production.up.railway.app/api/admin/metrics \
  -H "Authorization: Bearer $TOKEN"
```

### Admin Dashboard Checks

1. **Login**: `https://trustescrow-admin.vercel.app/login`
2. **Dashboard**: Should show metrics
3. **Deals**: Should load (empty initially)
4. **Navigation**: All links working
5. **Logout**: Should redirect to login

### SMS Integration Test

```bash
# Send test SMS to your Africa's Talking shortcode
# From your phone: Send "START" to your shortcode

# Check Railway logs:
railway logs

# Should see:
# - Inbound SMS received
# - AI agent processing
# - Outbound SMS sent
```

### Payment Webhook Test

Configure Paystack webhook:
1. Go to Paystack Dashboard → Settings → Webhooks
2. Set URL: `https://trustescrow-ng-production.up.railway.app/api/webhooks/paystack`
3. Test with Paystack test mode first

---

## 🔒 PART 5: Security Hardening

### 1. Update Admin Passwords

```bash
# Generate strong passwords
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Update Railway environment
railway variables set ADMIN_USERS='[{"username":"admin","password":"<STRONG_PASSWORD>","role":"super_admin"}]'
```

### 2. Rotate Secrets

```bash
# Generate new JWT secret (256-bit)
railway variables set ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Generate new encryption key (32 bytes)
railway variables set ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Generate new NIN salt
railway variables set NIN_SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 3. Enable HTTPS-Only

Railway and Vercel handle this automatically. Verify:
```bash
curl -I http://trustescrow-ng-production.up.railway.app
# Should redirect to https://
```

### 4. Configure Rate Limiting

Already implemented in code. Verify in Railway logs that rate limiting is active.

---

## 📈 PART 6: Monitoring Setup

### Sentry Error Tracking

1. Create Sentry account: [https://sentry.io](https://sentry.io)
2. Create new project (Node.js)
3. Copy DSN
4. Add to Railway:
```bash
railway variables set SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

### Railway Metrics

Railway provides built-in monitoring:
- CPU usage
- Memory usage
- Request rate
- Response time

Access via Railway dashboard.

### Bull Board (Queue Monitoring)

Already deployed with your API. Access at:
```
https://trustescrow-ng-production.up.railway.app/admin/queues
```

(Make sure to add authentication if exposing publicly)

---

## 🔄 PART 7: Continuous Deployment

### Auto-Deploy from GitHub

Railway supports GitHub integration:

1. Go to Railway dashboard
2. Settings → GitHub
3. Connect your repository
4. Enable auto-deploy on push to `main` branch

Now every push to `main` triggers deployment!

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/admin
```

---

## 🐛 Troubleshooting

### Issue: Railway Build Fails

**Check:**
1. Dockerfile is in correct location
2. All dependencies in package.json
3. Prisma schema is valid

**Solution:**
```bash
# Test build locally
docker build -t trustescrow-api -f apps/api/Dockerfile .
docker run -p 3000:3000 trustescrow-api
```

### Issue: Database Migration Fails

**Check Railway logs:**
```bash
railway logs
```

**Manual migration:**
```bash
railway run npx prisma migrate deploy
```

### Issue: Admin Can't Connect to API

**Check:**
1. CORS configuration in Railway
2. API URL in Vercel environment variables
3. Network tab in browser for errors

**Solution:**
```bash
# Update CORS
railway variables set ADMIN_CORS_ORIGIN=https://trustescrow-admin.vercel.app

# Redeploy
railway up
```

### Issue: SMS Not Sending

**Check:**
1. Africa's Talking credentials are live (not sandbox)
2. Shortcode is active
3. BullMQ worker is running

**Debug:**
```bash
railway logs --filter="SMS"
```

---

## 💰 Cost Estimation

### Railway (API + Database)
- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited)
- **Database**: Included in plan

### Vercel (Admin Dashboard)
- **Free Plan**: $0/month (perfect for admin dashboard)
- **Pro Plan**: $20/month (if needing more)

### Upstash (Redis)
- **Pay-as-you-go**: ~$0.20 per 100k commands
- **Estimated**: $5-10/month

### Total Infrastructure: $10-30/month

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All code committed to git
- [ ] Environment variables documented
- [ ] Strong passwords generated
- [ ] API keys collected
- [ ] Railway account created
- [ ] Vercel account created
- [ ] Upstash Redis created

### Railway Deployment
- [ ] Railway CLI installed
- [ ] Logged in to Railway
- [ ] Project created
- [ ] PostgreSQL added
- [ ] Redis configured
- [ ] All environment variables set
- [ ] Deployed successfully
- [ ] Health check passes
- [ ] Database migrated

### Vercel Deployment
- [ ] Vercel CLI installed
- [ ] Logged in to Vercel
- [ ] Project created
- [ ] Environment variables set
- [ ] Deployed successfully
- [ ] Can access login page
- [ ] Can login with admin credentials

### Post-Deployment
- [ ] CORS updated in Railway
- [ ] SMS test successful
- [ ] Payment webhook configured
- [ ] Sentry error tracking active
- [ ] Admin passwords changed
- [ ] Secrets rotated
- [ ] Documentation updated
- [ ] Team trained

---

## 🎯 Quick Commands Reference

```bash
# RAILWAY COMMANDS
railway login                    # Login
railway init                     # Initialize project
railway add                      # Add services
railway variables                # Manage env vars
railway up                       # Deploy
railway logs                     # View logs
railway open                     # Open dashboard
railway run <command>            # Run command in production

# VERCEL COMMANDS
vercel login                     # Login
vercel                           # Deploy to preview
vercel --prod                    # Deploy to production
vercel logs                      # View logs
vercel env                       # Manage env vars
vercel domains                   # Manage domains

# MONITORING
railway logs --tail              # Live logs
railway logs --filter="ERROR"    # Filter logs
railway metrics                  # View metrics
```

---

## 🚀 Ready to Deploy!

Follow this guide step by step, and your TrustEscrow NG platform will be live in production within 1-2 hours!

**Support**: If you encounter issues, check Railway and Vercel documentation, or review the troubleshooting section above.

---

*Last updated: June 5, 2026*  
*Deployment tested and verified on macOS*
