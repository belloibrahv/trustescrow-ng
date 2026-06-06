# TrustEscrow NG - Quick Deployment Guide

**Time Required**: 30-45 minutes  
**Status**: Using Development Credentials  
**Date**: June 6, 2026

---

## 🚀 Two Ways to Deploy

### Option 1: Automated Script (Recommended)

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Guide you through Upstash Redis setup
- ✅ Login to Railway and Vercel
- ✅ Deploy API with PostgreSQL
- ✅ Deploy Admin Dashboard
- ✅ Configure environment variables
- ✅ Test health endpoints

### Option 2: Manual Deployment

Follow the detailed guide: `DEPLOY_WITH_DEV_CREDENTIALS.md`

---

## 📋 Before You Start

### 1. Create Upstash Redis (5 minutes)

**Required before running the deployment script!**

1. Go to: https://upstash.com
2. Sign up / Login with GitHub
3. Click **"Create Database"**
4. Configure:
   - **Name**: `trustescrow-redis-dev`
   - **Type**: Regional
   - **Region**: Choose closest to you (e.g., US, EU)
   - **TLS**: Enabled
5. Click **"Create"**
6. **Copy the Redis URL** (starts with `rediss://`)
7. Save it somewhere - you'll paste it when the script asks

**Example Redis URL:**
```
rediss://default:AbCdEf1234567890@us1-abc-xyz.upstash.io:6379
```

### 2. Verify CLI Tools

```bash
# Check installations
railway --version  # Should show version
vercel --version   # Should show version
node -v            # Should be v20 or higher
```

All tools are already installed ✅

---

## 🎯 Running the Deployment

### Start Deployment

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

### What to Expect

The script will prompt you at key points:

1. **Upstash Redis URL** - Paste the URL you copied earlier
2. **Railway Login** - Browser will open, login with GitHub
3. **Railway Project Name** - Press Enter (uses default: trustescrow-ng-dev)
4. **Railway Deployment** - Wait 5-10 minutes for build
5. **Railway URL** - Copy the URL shown (e.g., `trustescrow-ng-dev.up.railway.app`)
6. **Vercel Login** - Browser will open, login with GitHub
7. **Vercel Project** - Follow prompts (use default: trustescrow-admin-dev)
8. **Vercel URL** - Copy the URL shown (e.g., `trustescrow-admin-dev.vercel.app`)

---

## ✅ After Deployment

### 1. Test API

```bash
# Replace with your actual Railway URL
curl https://your-railway-url.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "db": "connected",
  "redis": "connected",
  "timestamp": "2026-06-06T..."
}
```

### 2. Test Admin Dashboard

1. Open your Vercel URL in browser
2. You should see the login page
3. Login with:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Dashboard should load with metrics

### 3. Configure Webhooks

#### Paystack Webhook

1. Go to: https://dashboard.paystack.com/#/settings/developer
2. Click **"Webhooks"**
3. Add URL: `https://your-railway-url.up.railway.app/api/webhooks/paystack`
4. Click **"Save"**

#### Africa's Talking Callback

1. Go to: https://account.africastalking.com/
2. Navigate to **SMS → Callback URLs**
3. Set URL: `https://your-railway-url.up.railway.app/api/sms/inbound`
4. Click **"Save"**

### 4. Test SMS Flow

Send SMS to shortcode `96207`:
```
START
```

Check Railway logs:
```bash
cd /Users/kudiratbello/trustescrow-ng
railway logs --tail
```

You should see SMS processing logs.

---

## 📊 Monitor Your Deployment

### View Logs

```bash
# Railway API logs
railway logs --tail

# Vercel Admin logs
cd apps/admin
vercel logs --follow
```

### Open Dashboards

```bash
# Railway dashboard
railway open

# Or visit directly:
# https://railway.app/dashboard
# https://vercel.com/dashboard
# https://console.upstash.com
```

---

## 🐛 Common Issues

### Issue: "Railway CLI not found"

```bash
brew install railway
```

### Issue: "API health check fails"

```bash
# Check logs
railway logs

# Common causes:
# - Redis URL incorrect
# - Database not connected
# - Environment variables missing
```

### Issue: "Admin can't connect to API"

```bash
# Check CORS is set
railway variables get ADMIN_CORS_ORIGIN

# Update if needed
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url.vercel.app"
```

### Issue: "Redis connection failed"

1. Verify Redis URL format: `rediss://` (with double 's')
2. Ensure TLS is enabled in Upstash
3. Check Redis is active in Upstash dashboard

```bash
# Update Redis URL
railway variables set REDIS_URL="your-redis-url"
```

---

## 🔄 Redeploy Commands

### Redeploy API

```bash
cd /Users/kudiratbello/trustescrow-ng
railway up
```

### Redeploy Admin

```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin
vercel --prod
```

---

## 📝 Important Notes

**Current Setup:**
- ✅ Using Africa's Talking sandbox mode
- ✅ Using Paystack test keys
- ✅ Using development passwords
- ⚠️ **Do not use for real transactions yet!**

**Before Going Live:**
1. Switch to production API keys
2. Change admin password
3. Use production Prembly credentials
4. Enable production mode
5. Setup monitoring alerts

---

## 💰 Current Costs

| Service | Cost |
|---------|------|
| Railway (Hobby) | ~$5/month |
| Vercel (Hobby) | Free |
| Upstash (Free) | $0/month |
| **Total** | **~$5/month** |

---

## 📞 Need Help?

**Documentation:**
- Full Guide: `DEPLOY_WITH_DEV_CREDENTIALS.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`
- README: `README.md`

**Logs:**
```bash
# API logs
railway logs --tail

# Admin logs
cd apps/admin && vercel logs
```

**Status Pages:**
- Railway: https://railway.app/status
- Vercel: https://vercel.com/status
- Upstash: https://status.upstash.com

---

## ✅ Success Checklist

After deployment, verify:

- [ ] API health check returns 200
- [ ] Can login to admin dashboard
- [ ] Dashboard shows metrics
- [ ] No CORS errors in browser console
- [ ] Railway logs show no errors
- [ ] Redis connected successfully
- [ ] Database connected successfully
- [ ] Webhooks configured

---

## 🎉 Ready to Deploy!

**Start here:**
```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

**Estimated time:** 30-45 minutes  
**Difficulty:** Easy (mostly automated)

Good luck! 🚀

---

*Quick Deploy Guide - June 6, 2026*  
*Using Development Environment Credentials*
