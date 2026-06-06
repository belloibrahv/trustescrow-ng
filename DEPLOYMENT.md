# TrustEscrow NG - Deployment Guide

**Quick Start:** Deploy your TrustEscrow platform in 30 minutes.

---

## 🚀 Quick Deploy (Recommended)

### Prerequisites
- [x] Node.js 20+ installed
- [x] GitHub repository created ✅
- [ ] Upstash Redis database (create below)

### Step 1: Create Upstash Redis (5 minutes)

1. Go to: https://console.upstash.com
2. Sign up / Login
3. Click **"Create Database"**
4. Configure:
   - **Name**: `trustescrow-redis-dev`
   - **Region**: Choose closest to you
   - **TLS**: ✅ Enabled
5. Click **"Create"**
6. ✅ **Already created** - Your Redis URL:
   ```
   rediss://default:gQAAA...@vocal-monarch-144030.upstash.io:6379
   ```

### Step 2: Deploy to Railway (15 minutes)

#### Option A: GitHub Integration (Recommended)

1. **Go to Railway**: https://railway.app
2. **New Project** → "Deploy from GitHub repo"
3. **Authorize GitHub** and select: `belloibrahv/trustescrow-ng`
4. **Add PostgreSQL**:
   - Click "New" → "Database" → "PostgreSQL"
5. **Set Environment Variables**:
   - Click your service → "Variables" tab → "Raw Editor"
   - Copy content from `.env.railway.template`
   - Paste and save
6. **Wait for deployment** (5-10 minutes)
7. **Get Railway URL** from settings
8. **Update variables**:
   - `APP_URL=https://your-railway-url`
   - Railway auto-redeploys

#### Option B: CLI Deployment

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

Follow the prompts - the script handles everything!

### Step 3: Deploy Admin Dashboard (10 minutes)

```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set API URL
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-railway-url.up.railway.app

# Redeploy with env var
vercel --prod
```

### Step 4: Update CORS

In Railway dashboard, update:
```
ADMIN_CORS_ORIGIN=https://your-vercel-url.vercel.app
```

Railway will auto-redeploy.

### Step 5: Configure Webhooks

**Paystack:**
```
https://dashboard.paystack.com/#/settings/developer
→ Add webhook: https://your-railway-url/api/webhooks/paystack
```

**Africa's Talking:**
```
https://account.africastalking.com/
→ SMS Callback: https://your-railway-url/api/sms/inbound
```

---

## ✅ Verify Deployment

### Test API
```bash
curl https://your-railway-url.up.railway.app/health
```

**Expected:**
```json
{"status":"ok","db":"connected","redis":"connected"}
```

### Test Admin
1. Open: `https://your-vercel-url.vercel.app`
2. Login: `admin` / `admin123`
3. Dashboard should load with metrics

---

## 📊 Your Infrastructure

| Service | Platform | Cost | Status |
|---------|----------|------|--------|
| API Server | Railway | $5/month | ✅ Ready |
| PostgreSQL | Railway | Included | ✅ Ready |
| Redis | Upstash | Free | ✅ Created |
| Admin Dashboard | Vercel | Free | Ready to deploy |
| **Total** | | **$5/month** | |

**Redis Details:**
- URL: `rediss://default:gQAAA...@vocal-monarch-144030.upstash.io:6379`
- Endpoint: `vocal-monarch-144030.upstash.io`
- Port: `6379`
- TLS: Enabled ✅

---

## 🔄 Continuous Deployment

With Railway + GitHub integration:

1. Make code changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push`
4. Railway auto-deploys! 🎉

---

## 📚 Detailed Guides

For more information, see:

- **[docs/deployment/START_DEPLOYMENT_HERE.md](docs/deployment/START_DEPLOYMENT_HERE.md)** - Step-by-step guide
- **[docs/deployment/GITHUB_DEPLOYMENT_GUIDE.md](docs/deployment/GITHUB_DEPLOYMENT_GUIDE.md)** - GitHub integration
- **[docs/deployment/DEPLOYMENT_TROUBLESHOOTING.md](docs/deployment/DEPLOYMENT_TROUBLESHOOTING.md)** - Fix issues
- **[docs/deployment/DEPLOYMENT_CHECKLIST_SIMPLE.md](docs/deployment/DEPLOYMENT_CHECKLIST_SIMPLE.md)** - Printable checklist

---

## 🆘 Quick Troubleshooting

### API health check fails
```bash
# Check logs
railway logs --tail

# Common fixes:
railway variables set REDIS_URL="your-redis-url"
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
```

### Admin can't connect
```bash
# Update CORS
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url.vercel.app"
```

### Redis connection issues
Ensure Redis URL starts with `rediss://` (double 's' for TLS)

---

## 📞 Support

**Documentation:**
- Main README: [README.md](README.md)
- Docs Index: [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)

**Dashboards:**
- Railway: https://railway.app/dashboard
- Vercel: https://vercel.com/dashboard
- Upstash: https://console.upstash.com
- GitHub: https://github.com/belloibrahv/trustescrow-ng

**Status Pages:**
- Railway: https://railway.app/status
- Vercel: https://vercel.com/status
- Upstash: https://status.upstash.com

---

## ⚠️ Current Setup

**Using Development Credentials:**
- ✅ Africa's Talking: Sandbox mode
- ✅ Paystack: Test keys
- ✅ Default admin password: `admin123` (change after deployment!)
- ⚠️ **Do not use for real transactions until production credentials are configured**

---

## 🎉 Ready to Deploy!

Start here:
1. Ensure Upstash Redis is created ✅
2. Deploy to Railway (15 minutes)
3. Deploy admin to Vercel (10 minutes)
4. Test everything!

**Total time:** ~30 minutes  
**Total cost:** ~$5/month

Good luck! 🚀

---

*Last Updated: June 6, 2026*  
*Repository: github.com/belloibrahv/trustescrow-ng*
