# TrustEscrow NG - Quick Start Deployment Guide

**⏱️ Time Required**: 2-3 hours  
**💰 Cost**: ~$10-30/month  
**📋 Prerequisites**: macOS with Node.js 20+ installed

---

## 🎯 What You'll Deploy

1. **API Server** → Railway (with PostgreSQL)
2. **Admin Dashboard** → Vercel
3. **Redis** → Upstash

---

## 🚀 Step-by-Step (Copy & Paste)

### Step 1: Generate Secrets (2 minutes)

```bash
cd /Users/kudiratbello/trustescrow-ng
node generate-secrets.js
```

**📝 Action**: Copy all output to a secure location (password manager)

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

### Step 3: Create Upstash Redis (5 minutes)

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up / Login
3. Click "Create Database"
4. Name: `trustescrow-redis`
5. Region: Choose closest to you
6. Copy the **Redis URL** (starts with `rediss://`)

---

### Step 4: Deploy API to Railway (15 minutes)

```bash
# Login to Railway
railway login

# Initialize project
cd /Users/kudiratbello/trustescrow-ng
railway init

# When prompted:
# - Project name: trustescrow-ng-production
# - Environment: production

# Add PostgreSQL
railway add --database postgres

# Open Railway dashboard to set environment variables
railway open
```

**In Railway Dashboard:**

1. Click on your service
2. Go to "Variables" tab
3. Click "New Variable" and add ALL of these:

```bash
NODE_ENV=production
PORT=3000
ADMIN_JWT_SECRET=<from-generate-secrets-output>
ENCRYPTION_KEY=<from-generate-secrets-output>
NIN_SALT=<from-generate-secrets-output>
ADMIN_USERS=<from-generate-secrets-output>
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=<your-upstash-redis-url>

# Africa's Talking (get from dashboard)
AT_USERNAME=<your-username>
AT_API_KEY=<your-api-key>
AT_SHORTCODE=<your-shortcode>
AT_SENDER_ID=TRUSTESCROW

# Paystack (get from dashboard)
PAYSTACK_SECRET_KEY=<your-secret-key>
PAYSTACK_PUBLIC_KEY=<your-public-key>
PAYSTACK_WEBHOOK_SECRET=<your-webhook-secret>
PAYSTACK_DVA_PROVIDER=wema-bank

# Prembly (get from dashboard)
PREMBLY_API_KEY=<your-api-key>
PREMBLY_APP_ID=<your-app-id>
PREMBLY_BASE_URL=https://api.prembly.com

# AI Provider
ANTHROPIC_API_KEY=<your-anthropic-key>
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_MAX_TOKENS=1024

# Feature Flags
USE_MOCK_NIN=false
USE_MOCK_PAYSTACK=false
LIVENESS_THRESHOLD=500000
DVA_EXPIRY_DAYS=7
DISPUTE_AUTO_ESCALATE_HOURS=48
MAX_NIN_ATTEMPTS=3
```

**Then deploy:**

```bash
# From project root
railway up
```

⏳ **Wait 5-10 minutes** for build to complete.

**Get your API URL:**
```bash
railway status
```

Copy the URL (something like `trustescrow-ng-production.up.railway.app`)

**Update APP_URL variable:**
1. Go back to Railway dashboard
2. Update `APP_URL=https://<your-railway-url>`

**Test it:**
```bash
curl https://<your-railway-url>/health
```

Expected: `{"status":"ok","db":"connected","time":"..."}`

---

### Step 5: Deploy Admin to Vercel (10 minutes)

```bash
# Login to Vercel
vercel login

# Navigate to admin directory
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# Deploy to production
vercel --prod

# When prompted:
# - Set up and deploy? Yes
# - Project name: trustescrow-admin
# - Directory: ./
# - Override settings? No
```

⏳ **Wait 3-5 minutes** for deployment.

**Set environment variable:**

```bash
# Add API URL
vercel env add NEXT_PUBLIC_API_URL production
# Enter value: https://<your-railway-url>

# Redeploy with environment variable
vercel --prod
```

**Get your Admin URL** (shown in terminal after deployment)

**Test it:**
Open browser to your Vercel URL (like `trustescrow-admin.vercel.app`)

---

### Step 6: Connect API & Admin (5 minutes)

Update CORS in Railway:

```bash
# Set CORS origin
railway variables set ADMIN_CORS_ORIGIN=https://<your-vercel-url>

# Redeploy
railway up
```

**Test login:**
1. Go to your admin URL
2. Login with credentials from `generate-secrets.js` output
3. Should see dashboard with metrics

---

### Step 7: Configure Third-Party Webhooks (10 minutes)

**Paystack Webhook:**
1. Go to [Paystack Dashboard → Settings → Webhooks](https://dashboard.paystack.com/#/settings/developer)
2. Add webhook URL: `https://<your-railway-url>/api/webhooks/paystack`
3. Test webhook

**Africa's Talking Callback:**
1. Go to [AT Dashboard → SMS](https://account.africastalking.com/)
2. Set callback URL: `https://<your-railway-url>/api/sms/inbound`
3. Test by sending SMS "START" to your shortcode

---

## ✅ Verification Checklist

Run these tests to confirm everything works:

### 1. API Health
```bash
curl https://<your-railway-url>/health
```
Expected: `{"status":"ok"}`

### 2. Admin Login
- Open: `https://<your-vercel-url>`
- Login with admin credentials
- Dashboard should load with metrics

### 3. Admin API Connection
- In admin dashboard, navigate to "Deals" page
- Should load without CORS errors
- Check browser console (F12) for errors

### 4. SMS Integration (Optional for now)
- Send SMS "START" to your shortcode
- Check Railway logs: `railway logs --tail`
- Should see SMS processing

---

## 🎉 You're Live!

Your TrustEscrow NG platform is now running in production!

**URLs to Bookmark:**
- **API**: `https://<your-railway-url>`
- **Admin**: `https://<your-vercel-url>`
- **Railway Dashboard**: [https://railway.app/dashboard](https://railway.app/dashboard)
- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)

---

## 📊 Monitor Your Deployment

### Railway Logs
```bash
railway logs --tail
```

### Vercel Logs
```bash
vercel logs
```

### Check Metrics
- Railway: View in dashboard (CPU, memory, requests)
- Admin: View dashboard page for deal metrics

---

## 🐛 Quick Troubleshooting

### Issue: API health check fails
**Fix:**
```bash
railway logs
# Look for errors, usually database connection or env vars
```

### Issue: Admin can't connect to API
**Fix:**
```bash
# Check CORS is set
railway variables get ADMIN_CORS_ORIGIN

# Update if needed
railway variables set ADMIN_CORS_ORIGIN=https://<vercel-url>
railway up
```

### Issue: SMS not working
**Fix:**
- Check Africa's Talking balance
- Verify callback URL is set correctly
- Check Railway logs for SMS processing errors

### Issue: Can't login to admin
**Fix:**
- Check admin credentials from `generate-secrets.js`
- Verify `ADMIN_USERS` variable is set in Railway
- Check browser console for API errors

---

## 🔄 Redeploy Commands

If you need to redeploy:

```bash
# API (Railway)
cd /Users/kudiratbello/trustescrow-ng
railway up

# Admin (Vercel)
cd /Users/kudiratbello/trustescrow-ng/apps/admin
vercel --prod
```

---

## 💡 Pro Tips

1. **Use Railway's GitHub Integration**
   - Connect your GitHub repo
   - Enable auto-deploy on push to `main`
   - Never manually deploy again!

2. **Set up Monitoring**
   - Add Sentry for error tracking
   - Use UptimeRobot for uptime monitoring
   - Set up alerts in Railway

3. **Custom Domains (Optional)**
   - Railway: Settings → Domains → Add domain
   - Vercel: Settings → Domains → Add domain
   - Update DNS with CNAME records

4. **Backup Your Database**
   - Railway auto-backs up PostgreSQL
   - Download backup: Railway dashboard → Database → Backups

---

## 📞 Need Help?

**Common Resources:**
- Railway Docs: [https://docs.railway.app](https://docs.railway.app)
- Vercel Docs: [https://vercel.com/docs](https://vercel.com/docs)
- Your deployment guide: `DEPLOYMENT_GUIDE_COMPLETE.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`

**Stuck?**
1. Check logs: `railway logs` or `vercel logs`
2. Review error messages
3. Check environment variables are set
4. Verify third-party credentials are correct

---

## 🎯 Next Steps After Deployment

1. **Change Passwords**
   - Login to admin
   - Change admin password
   - Update password manager

2. **Test Full Flow**
   - Send test SMS
   - Create test deal
   - Test payment (use Paystack test mode first!)
   - Test dispute flow

3. **Monitor First 24 Hours**
   - Check logs regularly
   - Watch for errors in Sentry
   - Test SMS and payments multiple times

4. **Go Live**
   - Switch from test to live API keys
   - Start with small transactions
   - Gradually increase volume

---

**Congratulations! Your platform is deployed! 🎉**

*Deployment time: ~2 hours from start to finish*  
*Cost: ~$10-30/month for infrastructure*

---

*Last updated: June 5, 2026*
