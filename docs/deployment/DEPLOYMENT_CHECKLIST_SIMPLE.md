# TrustEscrow NG - Deployment Checklist ✅

Print this and check off as you go!

---

## Pre-Deployment (5 minutes)

- [ ] Node.js 20+ installed (`node -v`)
- [ ] Railway CLI installed (`railway --version`)
- [ ] Vercel CLI installed (`vercel --version`)
- [ ] Have GitHub account ready for OAuth logins

---

## Step 1: Create Upstash Redis (5 minutes)

- [ ] Go to https://upstash.com
- [ ] Sign up / Login
- [ ] Click "Create Database"
- [ ] Name: `trustescrow-redis-dev`
- [ ] Region: Choose closest to you
- [ ] TLS: Enabled
- [ ] Copy Redis URL
- [ ] Save URL to clipboard/notepad

**Redis URL format:** `rediss://default:password@host:6379`

---

## Step 2: Run Deployment Script (30 minutes)

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

### During Script Execution:

#### Railway Setup
- [ ] Paste Upstash Redis URL when prompted
- [ ] Login to Railway (browser opens)
- [ ] Wait for project initialization
- [ ] Wait for PostgreSQL to be added
- [ ] Wait for environment variables to be set
- [ ] Wait for API deployment (5-10 minutes)

#### Get Railway URL
- [ ] Copy Railway URL from terminal
- [ ] Paste when script asks
- [ ] Format: `your-project.up.railway.app` (no https://)

#### Test API
- [ ] Health check runs automatically
- [ ] Should see: `{"status":"ok","db":"connected"}`
- [ ] If fails, check logs: `railway logs`

#### Vercel Setup
- [ ] Login to Vercel (browser opens)
- [ ] Confirm project name: `trustescrow-admin-dev`
- [ ] Wait for admin deployment (3-5 minutes)
- [ ] Wait for redeploy with environment variables

#### Get Vercel URL
- [ ] Copy Vercel URL from terminal
- [ ] Paste when script asks
- [ ] Format: `your-project.vercel.app` (no https://)

#### Final Steps
- [ ] CORS origin set automatically
- [ ] Deployment info saved to `DEPLOYMENT_INFO.txt`

---

## Step 3: Verify Deployment (10 minutes)

### Test API
```bash
curl https://YOUR-RAILWAY-URL/health
```
- [ ] Returns 200 OK
- [ ] Shows `db: connected`
- [ ] Shows `redis: connected`

### Test Admin Dashboard
- [ ] Open `https://YOUR-VERCEL-URL` in browser
- [ ] See login page
- [ ] Login: `admin` / `admin123`
- [ ] Dashboard loads
- [ ] Metrics show data
- [ ] No CORS errors (check browser console F12)

### Check Logs
```bash
railway logs --tail
```
- [ ] No error messages
- [ ] Database connected
- [ ] Redis connected
- [ ] Server started successfully

---

## Step 4: Configure Webhooks (10 minutes)

### Paystack
- [ ] Go to https://dashboard.paystack.com/#/settings/developer
- [ ] Click "Webhooks"
- [ ] Add URL: `https://YOUR-RAILWAY-URL/api/webhooks/paystack`
- [ ] Save
- [ ] Test webhook (optional)

### Africa's Talking
- [ ] Go to https://account.africastalking.com/
- [ ] Navigate to SMS → Callback URLs
- [ ] Set URL: `https://YOUR-RAILWAY-URL/api/sms/inbound`
- [ ] Save

---

## Step 5: Test SMS Flow (5 minutes)

- [ ] Send SMS "START" to shortcode `96207`
- [ ] Check Railway logs: `railway logs --tail`
- [ ] Should see SMS processing
- [ ] Should receive response SMS

---

## Step 6: Security (5 minutes)

### Change Admin Password
- [ ] Login to admin dashboard
- [ ] Navigate to Settings (if available)
- [ ] Change password from `admin123` to strong password
- [ ] Save new password to password manager

### Save Credentials
- [ ] Save Railway dashboard URL
- [ ] Save Vercel dashboard URL
- [ ] Save Upstash dashboard URL
- [ ] Save admin credentials
- [ ] Save all URLs in secure location

---

## Post-Deployment (Optional)

### Monitor First 24 Hours
- [ ] Check logs every few hours
- [ ] Test SMS multiple times
- [ ] Test admin dashboard functionality
- [ ] Monitor Railway metrics (CPU, memory)

### Documentation
- [ ] Update team wiki with deployment URLs
- [ ] Share admin credentials with team (securely)
- [ ] Document any issues encountered
- [ ] Create runbook for common operations

### Setup Alerts (Optional)
- [ ] Railway: Enable email alerts
- [ ] Uptime monitoring: UptimeRobot or Pingdom
- [ ] Error tracking: Already using Sentry (if configured)

---

## Quick Reference

### Your Deployment URLs

**API (Railway)**
```
https://_____________________.up.railway.app
```

**Admin (Vercel)**
```
https://_____________________.vercel.app
```

**Redis (Upstash)**
```
rediss://_____________________________________
```

### Credentials

**Admin Login**
- Username: `admin`
- Password: `admin123` (change this!)

### Commands

```bash
# View Railway logs
railway logs --tail

# View Vercel logs
cd apps/admin && vercel logs

# Redeploy API
railway up

# Redeploy Admin
cd apps/admin && vercel --prod

# Open Railway dashboard
railway open
```

---

## ✅ Deployment Complete Checklist

- [ ] API deployed and healthy
- [ ] Admin deployed and accessible
- [ ] Can login to admin
- [ ] Dashboard shows metrics
- [ ] Redis connected
- [ ] Database connected
- [ ] Webhooks configured
- [ ] SMS tested
- [ ] Logs clean (no errors)
- [ ] Credentials saved
- [ ] Team notified

---

## 🎉 Success!

**Your TrustEscrow NG platform is now live!**

**API:** https://_____________________.up.railway.app  
**Admin:** https://_____________________.vercel.app

**Next Steps:**
1. Test complete workflow
2. Monitor for 24 hours
3. Gather feedback
4. Plan production credential migration

---

## 🆘 Emergency Contacts

**Issues?**

1. Check logs: `railway logs --tail`
2. Check Vercel logs: `cd apps/admin && vercel logs`
3. Review: `DEPLOY_WITH_DEV_CREDENTIALS.md`
4. Check status pages:
   - Railway: https://railway.app/status
   - Vercel: https://vercel.com/status
   - Upstash: https://status.upstash.com

**Common Fixes:**
```bash
# Fix CORS issues
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url.vercel.app"

# Fix Redis connection
railway variables set REDIS_URL="your-redis-url"

# Redeploy
railway up
```

---

**Deployment Checklist - June 6, 2026**  
**Status: Using Development Credentials**  
**Estimated Time: 45-60 minutes**

Good luck! 🚀
