# TrustEscrow NG - GitHub + Railway Deployment

**Repository:** https://github.com/belloibrahv/trustescrow-ng  
**Status:** Code pushed to GitHub ✅  
**Next:** Deploy to Railway with GitHub integration

---

## ✅ What's Been Completed

### GitHub Setup
- ✅ Repository initialized
- ✅ All code committed (177 files)
- ✅ Admin dashboard code included
- ✅ Pushed to main branch
- ✅ Repository URL: https://github.com/belloibrahv/trustescrow-ng

### Deployment Package Ready
- ✅ Automated deployment script (`deploy-now.sh`)
- ✅ Dockerfile configured for Railway
- ✅ Railway configuration (`railway.toml`)
- ✅ Environment variables template
- ✅ Complete documentation
- ✅ Database migrations ready
- ✅ Docker Compose for local testing

---

## 🚀 Two Deployment Options

### Option 1: Railway with GitHub Integration (RECOMMENDED) ⭐

**Benefits:**
- Automatic deployments on git push
- No manual deploys needed
- Built-in CI/CD
- Easy rollbacks
- Better for team collaboration

**Steps:**

1. **Go to Railway Dashboard**
   ```
   https://railway.app
   ```

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize GitHub (if needed)
   - Select repository: `belloibrahv/trustescrow-ng`
   - Railway will detect the Dockerfile automatically

3. **Add PostgreSQL**
   - In your project, click "New"
   - Select "Database"
   - Choose "PostgreSQL"

4. **Set Environment Variables**
   - Click on your service
   - Go to "Variables" tab
   - Click "Raw Editor"
   - Copy content from: `railway-dev-env.txt` (you'll create this)
   - Paste and save

5. **Deploy**
   - Railway will automatically deploy
   - Watch the build logs
   - Get your Railway URL when done

### Option 2: CLI Deployment (Original Method)

Use the automated script we prepared:

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

This will deploy via CLI (not connected to GitHub).

---

## 📋 Pre-Deployment: Create Upstash Redis

**CRITICAL:** Do this BEFORE deploying!

1. Go to: https://upstash.com
2. Sign up / Login
3. Click "Create Database"
4. Configure:
   - **Name**: `trustescrow-redis-dev`
   - **Type**: Regional
   - **Region**: Choose closest to your Railway region
   - **TLS**: ✅ Enabled
5. Click "Create"
6. **Copy Redis URL** - starts with `rediss://`
7. Save it for the next step

---

## ⚙️ Environment Variables for Railway

Create this file with your specific values:

```bash
# Create environment variables file
cat > /Users/kudiratbello/trustescrow-ng/railway-production-env.txt << 'EOF'
# ═══════════════════════════════════════════════════════════
# TrustEscrow NG - Railway Production Environment Variables
# ═══════════════════════════════════════════════════════════

# SERVER
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# SECURITY
ADMIN_JWT_SECRET=5dcd6b12614b43103d54f8b822dfa51fe3cff8c52bf8390e604e7cbd6d7acd5f
ADMIN_USERS={"admin":"admin123","operator":"operator456"}
ADMIN_DEFAULT_PASSWORD=admin123
ENCRYPTION_KEY=350498d24b8d2ac5de614a99f970574b2d5a984bdec0ff60a4fb50fe19f07231
NIN_SALT=bbdbd612afc6d0b96b010df02e0afcce

# DATABASE (Railway injects this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# REDIS (UPDATE WITH YOUR UPSTASH URL)
REDIS_URL=rediss://YOUR_UPSTASH_URL_HERE

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

# FEATURE FLAGS
USE_MOCK_NIN=false
USE_MOCK_PAYSTACK=false
LIVENESS_THRESHOLD_KOBO=50000000
DVA_EXPIRY_DAYS=7
DISPUTE_AUTO_ESCALATE_HOURS=48
MAX_NIN_ATTEMPTS=3
DEAL_VALUE_CAP_KOBO=0

# CORS (Update after Vercel deployment)
ADMIN_CORS_ORIGIN=https://your-vercel-url.vercel.app

# APP URL (Update after Railway deployment)
APP_URL=https://your-railway-url.up.railway.app
EOF

echo "✅ Environment variables template created"
echo "📝 Edit the file and update:"
echo "   - REDIS_URL with your Upstash URL"
echo "   - APP_URL (after first deployment)"
echo "   - ADMIN_CORS_ORIGIN (after Vercel deployment)"
```

Then edit the file:
```bash
nano railway-production-env.txt
# or
code railway-production-env.txt
```

---

## 🎯 Deployment Steps (GitHub Integration)

### Step 1: Deploy API to Railway

1. **Login to Railway**: https://railway.app
2. **New Project** → "Deploy from GitHub repo"
3. **Select repo**: `belloibrahv/trustescrow-ng`
4. **Add PostgreSQL**: Click "New" → "Database" → "PostgreSQL"
5. **Set Variables**:
   - Click your service
   - Variables tab → Raw Editor
   - Paste from `railway-production-env.txt`
   - Update `REDIS_URL` with your Upstash URL
6. **Wait for deployment** (5-10 minutes)
7. **Get Railway URL** from settings
8. **Update Variables**:
   - Set `APP_URL=https://your-railway-url`
   - Railway will auto-redeploy

### Step 2: Deploy Admin to Vercel

```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# When prompted:
# - Link to existing project? No
# - Project name: trustescrow-admin
# - Directory: ./
# - Override settings? No

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-railway-url.up.railway.app

# Redeploy with env var
vercel --prod
```

### Step 3: Update CORS

```bash
# In Railway dashboard, update:
ADMIN_CORS_ORIGIN=https://your-vercel-url.vercel.app

# Railway will auto-redeploy
```

### Step 4: Configure Webhooks

**Paystack:**
1. https://dashboard.paystack.com/#/settings/developer
2. Webhooks → Add: `https://your-railway-url/api/webhooks/paystack`

**Africa's Talking:**
1. https://account.africastalking.com/
2. SMS → Callback: `https://your-railway-url/api/sms/inbound`

---

## ✅ Verify Deployment

### Test API
```bash
curl https://your-railway-url.up.railway.app/health
```

Expected:
```json
{"status":"ok","db":"connected","redis":"connected"}
```

### Test Admin
1. Open: `https://your-vercel-url.vercel.app`
2. Login: `admin` / `admin123`
3. Dashboard should load with metrics

---

## 🔄 Continuous Deployment (GitHub Integration)

Once Railway is connected to GitHub:

1. **Make changes** to your code locally
2. **Commit** changes:
   ```bash
   git add .
   git commit -m "Your changes"
   ```
3. **Push** to GitHub:
   ```bash
   git push
   ```
4. **Railway auto-deploys** - watch in dashboard!

---

## 📊 Monitoring

### Railway Dashboard
- View logs: Real-time in dashboard
- Metrics: CPU, memory, requests
- Deployments: History and rollback

### View Logs
```bash
# Install Railway CLI (if using CLI)
railway login
railway link  # Link to your project

# View logs
railway logs --tail
```

---

## 🆘 Troubleshooting

### Build Fails on Railway

**Check:**
1. Dockerfile path is correct (`apps/api/Dockerfile`)
2. All environment variables are set
3. PostgreSQL database is added
4. Build logs for specific errors

**Fix:**
```bash
# View build logs in Railway dashboard
# Or via CLI:
railway logs | grep ERROR
```

### Can't Access API

**Check:**
1. Deployment completed successfully
2. Railway URL is correct
3. Service is running (check dashboard)

### Admin Can't Connect

**Check:**
1. `NEXT_PUBLIC_API_URL` is set in Vercel
2. `ADMIN_CORS_ORIGIN` is set in Railway
3. Both deployments are live

---

## 💡 GitHub + Railway Benefits

### Automatic Deployments
- Push to main → Auto deploy
- No manual intervention
- Faster iterations

### Built-in CI/CD
- Automatic testing (if configured)
- Build verification
- Deploy previews (if needed)

### Easy Rollbacks
- Click "Redeploy" on previous deployment
- Instant rollback to working version

### Team Collaboration
- Multiple developers can push
- Automatic deployments for everyone
- Consistent deployment process

---

## 📝 Next Steps

After successful deployment:

1. **Test Everything**
   - API health check
   - Admin login
   - SMS flow
   - Payment webhooks

2. **Monitor First 24 Hours**
   - Check logs regularly
   - Test all features
   - Watch for errors

3. **Change Passwords**
   - Update admin password
   - Save credentials securely

4. **Setup Monitoring**
   - Enable Railway email alerts
   - Setup uptime monitoring
   - Configure error tracking

5. **Plan Production Migration**
   - Gather production API keys
   - Test thoroughly with dev credentials
   - Create migration plan

---

## 🎉 Your Deployment URLs

**Repository:**
```
https://github.com/belloibrahv/trustescrow-ng
```

**API (Railway):**
```
https://__________________.up.railway.app
```

**Admin (Vercel):**
```
https://__________________.vercel.app
```

**Dashboards:**
- Railway: https://railway.app/dashboard
- Vercel: https://vercel.com/dashboard
- Upstash: https://console.upstash.com
- GitHub: https://github.com/belloibrahv/trustescrow-ng

---

## 📚 Documentation References

- Full guide: `DEPLOY_WITH_DEV_CREDENTIALS.md`
- Quick reference: `QUICK_DEPLOY_GUIDE.md`
- Troubleshooting: `DEPLOYMENT_TROUBLESHOOTING.md`
- Checklist: `DEPLOYMENT_CHECKLIST_SIMPLE.md`

---

**GitHub Integration Complete!** ✅  
**Ready to Deploy!** 🚀  
**Good luck!** 💪

---

*GitHub Deployment Guide - June 6, 2026*  
*Repository: github.com/belloibrahv/trustescrow-ng*
