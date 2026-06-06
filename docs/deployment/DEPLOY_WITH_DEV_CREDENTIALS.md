# TrustEscrow NG - Deployment with Development Credentials

**Status**: Using development environment credentials until production credentials are available  
**Date**: June 6, 2026

---

## 🎯 Deployment Overview

We will deploy:
1. **API Server** → Railway (with PostgreSQL)
2. **Redis** → Upstash (Free tier)
3. **Admin Dashboard** → Vercel

**Credentials**: Using development credentials from `.env.development` until production credentials are ready

---

## ⚙️ Prerequisites Check

Before starting, ensure you have:

```bash
# Check Node.js version (need 20+)
node -v

# Check if Railway CLI is installed
railway --version || echo "Need to install Railway CLI"

# Check if Vercel CLI is installed
vercel --version || echo "Need to install Vercel CLI"

# Check Docker is running (for local testing)
docker ps || echo "Docker not running"
```

---

## 📋 Step-by-Step Deployment

### Step 1: Setup Upstash Redis (5 minutes)

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up / Login with GitHub
3. Click **"Create Database"**
4. Configure:
   - **Name**: `trustescrow-redis-dev`
   - **Type**: Regional
   - **Region**: Choose closest to your Railway deployment region
   - **TLS**: Enabled
5. Click **"Create"**
6. Copy the **Redis URL** (starts with `rediss://`)
7. Save it to your notes - you'll need it shortly

---

### Step 2: Install CLI Tools (3 minutes)

```bash
# Install Railway CLI
brew install railway

# Install Vercel CLI
npm install -g vercel

# Verify installations
railway --version
vercel --version
```

---

### Step 3: Prepare Environment Variables (5 minutes)

Create a file to store your environment variables:

```bash
# Create a secure file for environment variables
cat > /Users/kudiratbello/trustescrow-ng/railway-dev-env.txt << 'EOF'
# ═══════════════════════════════════════════════════════════
# TrustEscrow NG - Railway Environment Variables (DEV MODE)
# ═══════════════════════════════════════════════════════════

# SERVER
NODE_ENV=production
PORT=3000
APP_URL=https://YOUR_RAILWAY_URL_HERE
LOG_LEVEL=info

# SECURITY
ADMIN_JWT_SECRET=5dcd6b12614b43103d54f8b822dfa51fe3cff8c52bf8390e604e7cbd6d7acd5f
ADMIN_USERS={"admin":"admin123","operator":"operator456"}
ADMIN_DEFAULT_PASSWORD=admin123
ENCRYPTION_KEY=350498d24b8d2ac5de614a99f970574b2d5a984bdec0ff60a4fb50fe19f07231
NIN_SALT=bbdbd612afc6d0b96b010df02e0afcce

# DATABASE (Railway will inject DATABASE_URL automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# REDIS (UPDATE THIS WITH YOUR UPSTASH URL)
REDIS_URL=YOUR_UPSTASH_REDIS_URL_HERE

# AFRICA'S TALKING (Sandbox)
AT_USERNAME=sandbox
AT_API_KEY=atsk_a79f6c8a24a0eaa90fd9e44688a498bf4304eecf34a4673096f831eef6236d01b55346c9
AT_SHORTCODE=96207
AT_SENDER_ID=TRUSTESCROW

# PAYSTACK (Test Mode)
PAYSTACK_SECRET_KEY=sk_test_37780b726b59580bca6a7084a5424622aa7054f7
PAYSTACK_PUBLIC_KEY=pk_test_ec5ed34324eb8df91a9f02c494da3efb9ca01699
PAYSTACK_WEBHOOK_SECRET=sk_test_37780b726b59580bca6a7084a5424622aa7054f7
PAYSTACK_DVA_PROVIDER=wema-bank

# PREMBLY IDENTITYPASS (Sandbox)
PREMBLY_API_KEY=live_sk_2c9575f35064468ab1a056903afa02bc
PREMBLY_APP_ID=sandbox_xxxxxxxx
PREMBLY_BASE_URL=https://sandbox.prembly.com

# AI PROVIDER (GROQ)
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-groq
GROQ_API_KEY=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

# GITHUB MODELS (Fallback)
GITHUB_TOKEN=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

# DEEPSEEK (Alternative)
DEEPSEEK_API_KEY=sk-0265edcd2d494e6f8eaa997075321995

# FEATURE FLAGS (Development Settings)
USE_MOCK_NIN=false
USE_MOCK_PAYSTACK=false
LIVENESS_THRESHOLD_KOBO=50000000
DVA_EXPIRY_DAYS=7
DISPUTE_AUTO_ESCALATE_HOURS=48
MAX_NIN_ATTEMPTS=3
DEAL_VALUE_CAP_KOBO=0

# CORS (UPDATE AFTER VERCEL DEPLOYMENT)
ADMIN_CORS_ORIGIN=https://YOUR_VERCEL_URL_HERE

EOF

echo "✅ Environment variables template created at: railway-dev-env.txt"
echo "⚠️  Edit this file and update:"
echo "   - REDIS_URL with your Upstash URL"
echo "   - APP_URL (after first deployment)"
echo "   - ADMIN_CORS_ORIGIN (after Vercel deployment)"
```

**Now edit the file and update REDIS_URL:**

```bash
# Open in your editor
nano railway-dev-env.txt
# or
code railway-dev-env.txt
```

---

### Step 4: Deploy API to Railway (15 minutes)

#### 4.1 Login and Initialize

```bash
cd /Users/kudiratbello/trustescrow-ng

# Login to Railway (opens browser)
railway login

# Initialize Railway project
railway init
# When prompted:
# - Project name: trustescrow-ng-dev
# - Environment: production
```

#### 4.2 Add PostgreSQL

```bash
# Add PostgreSQL database
railway add --database postgres

# Verify it was added
railway status
```

#### 4.3 Set Environment Variables

```bash
# Open Railway dashboard
railway open
```

**In the Railway Dashboard:**

1. Click on your service (the one with your project name)
2. Click **"Variables"** tab
3. Click **"Raw Editor"** button
4. Copy the **entire content** from `railway-dev-env.txt`
5. Paste into the Raw Editor
6. Click **"Save"**

#### 4.4 Deploy

```bash
# Deploy to Railway
railway up

# This will:
# - Build the Docker image
# - Run database migrations
# - Start the API server
# 
# Wait 5-10 minutes for the build to complete
```

#### 4.5 Get Your Railway URL

```bash
# Get deployment information
railway status

# The URL will be shown (something like: trustescrow-ng-dev.up.railway.app)
```

**Copy your Railway URL and update environment variables:**

```bash
# Update APP_URL
railway variables set APP_URL="https://YOUR_ACTUAL_RAILWAY_URL"

# Verify the variable was set
railway variables get APP_URL
```

#### 4.6 Test API

```bash
# Replace with your actual Railway URL
RAILWAY_URL="your-railway-url.up.railway.app"

# Test health endpoint
curl https://$RAILWAY_URL/health

# Expected response:
# {"status":"ok","db":"connected","redis":"connected","timestamp":"..."}
```

**If health check fails:**

```bash
# Check logs
railway logs --tail

# Common issues:
# - Database not connected: Check DATABASE_URL variable
# - Redis not connected: Check REDIS_URL is correct
# - Build failed: Check Node.js version and dependencies
```

---

### Step 5: Deploy Admin Dashboard to Vercel (10 minutes)

#### 5.1 Build Admin Locally (Optional - Test First)

```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# Test build locally
npm run build

# If build succeeds, continue to deploy
```

#### 5.2 Login to Vercel

```bash
# Login to Vercel (opens browser)
vercel login
```

#### 5.3 Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# When prompted:
# - Set up and deploy "~/trustescrow-ng/apps/admin"? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - What's your project's name? trustescrow-admin-dev
# - In which directory is your code located? ./
# - Want to override the settings? No
```

#### 5.4 Set Environment Variable

```bash
# Add API URL environment variable
vercel env add NEXT_PUBLIC_API_URL production

# When prompted, enter your Railway URL:
# https://your-railway-url.up.railway.app

# Redeploy with environment variable
vercel --prod
```

#### 5.5 Get Your Vercel URL

After deployment completes, you'll see:

```
✅ Production: https://trustescrow-admin-dev.vercel.app [copied to clipboard]
```

**Copy this URL** - you'll need it for CORS configuration.

---

### Step 6: Connect API & Admin (5 minutes)

#### 6.1 Update CORS in Railway

```bash
cd /Users/kudiratbello/trustescrow-ng

# Update CORS origin with your Vercel URL
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url.vercel.app"

# Redeploy to apply changes
railway up
```

#### 6.2 Test Connection

1. Open your Vercel URL in browser: `https://your-vercel-url.vercel.app`
2. You should see the login page
3. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Dashboard should load with metrics
5. Navigate to **Deals** page - should load without errors
6. Open browser console (F12) - should see no CORS errors

---

### Step 7: Configure Webhooks (10 minutes)

#### 7.1 Paystack Webhook

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Click **"Webhooks"**
3. Add webhook URL:
   ```
   https://your-railway-url.up.railway.app/api/webhooks/paystack
   ```
4. Click **"Save"**
5. Test webhook delivery

#### 7.2 Africa's Talking Callback

1. Go to [Africa's Talking Dashboard](https://account.africastalking.com/)
2. Navigate to **SMS → Callback URLs**
3. Set callback URL:
   ```
   https://your-railway-url.up.railway.app/api/sms/inbound
   ```
4. Click **"Save"**
5. Test by sending SMS "START" to shortcode `96207`

---

## ✅ Deployment Verification Checklist

Run through these checks to ensure everything is working:

### API Health
```bash
# Replace with your Railway URL
RAILWAY_URL="your-railway-url.up.railway.app"

# Health check
curl https://$RAILWAY_URL/health | jq '.'

# Expected: {"status":"ok","db":"connected","redis":"connected"}
```

### Admin Dashboard
- [ ] Login page loads
- [ ] Can login with admin credentials
- [ ] Dashboard loads with metrics
- [ ] Deals page loads
- [ ] Disputes page loads
- [ ] No CORS errors in browser console

### Database
```bash
# Check Railway logs for database connection
railway logs --tail | grep -i "database"

# Should see: "Database connected successfully"
```

### Redis
```bash
# Check Railway logs for Redis connection
railway logs --tail | grep -i "redis"

# Should see: "Redis connected successfully"
```

### Webhooks
- [ ] Paystack webhook URL configured
- [ ] Africa's Talking callback URL configured
- [ ] Test SMS processed successfully

---

## 📊 Monitoring & Logs

### View Railway Logs

```bash
# Live tail
railway logs --tail

# Last 100 lines
railway logs

# Filter by level
railway logs | grep ERROR
railway logs | grep WARN
```

### View Vercel Logs

```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# View logs
vercel logs

# Follow logs in real-time
vercel logs --follow
```

### Railway Dashboard

```bash
# Open Railway dashboard in browser
railway open

# View:
# - CPU usage
# - Memory usage
# - Request metrics
# - Database metrics
```

---

## 🔧 Common Issues & Solutions

### Issue: Health check fails with database error

**Solution:**
```bash
# Check DATABASE_URL is set
railway variables get DATABASE_URL

# Check database is running
railway open
# Click on PostgreSQL service, verify it's running

# Check logs for specific error
railway logs | grep -i "database"
```

### Issue: Admin can't connect to API (CORS error)

**Solution:**
```bash
# Verify CORS is set correctly
railway variables get ADMIN_CORS_ORIGIN

# Update if needed
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url.vercel.app"

# Redeploy
railway up
```

### Issue: Redis connection fails

**Solution:**
1. Verify Upstash Redis URL is correct
2. Check URL format: `rediss://default:PASSWORD@HOST:PORT`
3. Ensure TLS is enabled in Upstash
```bash
# Update Redis URL
railway variables set REDIS_URL="your-correct-upstash-url"
```

### Issue: SMS not working

**Solution:**
1. Check Africa's Talking callback URL is set
2. Verify you're using sandbox mode with test numbers
3. Check Railway logs:
```bash
railway logs | grep -i "sms"
```

### Issue: Build fails on Railway

**Solution:**
```bash
# Check build logs
railway logs | grep -i "build"

# Common causes:
# - Missing dependencies: Check package.json
# - Prisma generation failed: Check prisma/schema.prisma
# - TypeScript errors: Run `npm run typecheck` locally

# Trigger rebuild
railway up
```

---

## 🚀 Deployment URLs

Save these URLs for easy access:

**API Server (Railway)**
```
URL: https://your-railway-url.up.railway.app
Health: https://your-railway-url.up.railway.app/health
Dashboard: https://railway.app/dashboard
```

**Admin Dashboard (Vercel)**
```
URL: https://your-vercel-url.vercel.app
Dashboard: https://vercel.com/dashboard
```

**Redis (Upstash)**
```
Dashboard: https://console.upstash.com
```

**Third-Party Services**
```
Paystack: https://dashboard.paystack.com
Africa's Talking: https://account.africastalking.com
Prembly: https://dashboard.prembly.com
```

---

## 📈 Next Steps

After successful deployment:

### 1. Change Default Passwords
```bash
# Login to admin dashboard
# Navigate to Settings → Change Password
# Update from "admin123" to a strong password
```

### 2. Test Complete Flow
- [ ] Send test SMS "START" to shortcode
- [ ] Verify deal creation
- [ ] Test identity verification
- [ ] Test payment flow (Paystack test mode)
- [ ] Test dispute resolution

### 3. Monitor First 24 Hours
- [ ] Check Railway logs regularly
- [ ] Monitor error rates
- [ ] Test SMS delivery multiple times
- [ ] Verify webhook processing

### 4. Setup Alerts (Optional)
- Railway: Enable email alerts for errors
- Upstash: Set up Redis alerts
- External: UptimeRobot for uptime monitoring

### 5. Document Deployment
- Save all URLs and credentials
- Document any issues encountered
- Create runbook for common operations

---

## 🔄 Redeployment Commands

If you need to redeploy:

### API (Railway)
```bash
cd /Users/kudiratbello/trustescrow-ng
railway up
```

### Admin (Vercel)
```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin
vercel --prod
```

### Quick Redeploy Both
```bash
# API
cd /Users/kudiratbello/trustescrow-ng && railway up

# Admin (in another terminal)
cd /Users/kudiratbello/trustescrow-ng/apps/admin && vercel --prod
```

---

## 🛡️ Security Notes

**Current Setup (Development Credentials):**
- ⚠️ Using Africa's Talking sandbox mode
- ⚠️ Using Paystack test keys
- ⚠️ Using development passwords
- ⚠️ MOCK flags are disabled (using real APIs)

**Before Production:**
1. Switch to Africa's Talking live mode
2. Switch to Paystack live keys
3. Change all passwords
4. Generate new JWT secrets
5. Use production Prembly credentials
6. Enable rate limiting
7. Setup monitoring and alerts
8. Configure backup strategy

---

## 💰 Cost Estimation

**Current Deployment Costs:**

| Service | Plan | Cost |
|---------|------|------|
| Railway | Hobby | $5/month (500 hours) |
| Vercel | Hobby | Free |
| Upstash | Free | $0/month (10K commands/day) |
| PostgreSQL | Railway | Included in Hobby plan |
| **Total** | | **~$5/month** |

**Transaction Costs:**
- Africa's Talking SMS: ~₦2 per SMS
- Paystack: 1.5% + ₦100 per transaction
- Prembly NIN verification: ~₦50 per check

---

## 📞 Support Resources

**Documentation:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Upstash: https://docs.upstash.com

**Dashboards:**
- Railway: https://railway.app/dashboard
- Vercel: https://vercel.com/dashboard
- Upstash: https://console.upstash.com

**API Status Pages:**
- Paystack: https://status.paystack.com
- Africa's Talking: https://status.africastalking.com
- Railway: https://railway.app/status

---

## ✅ Deployment Complete!

**Congratulations! Your TrustEscrow NG platform is now deployed! 🎉**

**What You've Deployed:**
- ✅ API Server on Railway with PostgreSQL
- ✅ Redis on Upstash (free tier)
- ✅ Admin Dashboard on Vercel
- ✅ Webhooks configured for Paystack & Africa's Talking
- ✅ Development credentials in use (safe for testing)

**Access Your Platform:**
- API: `https://your-railway-url.up.railway.app`
- Admin: `https://your-vercel-url.vercel.app`
- Login: admin / admin123

**Next:**
1. Test the complete flow
2. Monitor logs for 24 hours
3. Gather feedback
4. Plan migration to production credentials

---

*Deployment Guide Created: June 6, 2026*  
*Using: Development Environment Credentials*  
*Status: Ready for Testing & Development*
