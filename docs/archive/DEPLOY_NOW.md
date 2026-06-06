# 🚀 Deploy TrustEscrow NG NOW - Step by Step

**Using**: Development credentials (temporary)  
**Time**: 30-40 minutes  
**Date**: June 5, 2026

---

## ⚠️ IMPORTANT NOTES

- We're using **development credentials** temporarily
- Replace with **live credentials** before processing real transactions
- Admin passwords generated: See `railway-env-template.txt`
- All secrets saved in `railway-env-template.txt`

---

## STEP 1: Install Railway CLI (2 minutes)

```bash
# Install Railway CLI
brew install railway

# Verify installation
railway --version
```

**Expected output**: `railway version x.x.x`

---

## STEP 2: Login to Railway (1 minute)

```bash
# This will open your browser
railway login
```

**Action**: Sign up or login with GitHub/Email

---

## STEP 3: Create Railway Project (2 minutes)

```bash
# Navigate to project root
cd /Users/kudiratbello/trustescrow-ng

# Initialize Railway project
railway init

# When prompted:
# Project name: trustescrow-ng-staging
# Environment: production (or create 'staging')
```

---

## STEP 4: Add PostgreSQL Database (1 minute)

```bash
# Add PostgreSQL
railway add --database postgres
```

Railway will automatically configure `DATABASE_URL`

---

## STEP 5: Create Upstash Redis (5 minutes)

**Option A: Use Railway Plugin (Easier)**
```bash
railway add --plugin upstash-redis
```

**Option B: External Upstash (More control)**
1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Sign up/Login
3. Click "Create Database"
4. Name: `trustescrow-redis`
5. Region: Choose closest to you
6. Copy the **TLS (External) URL** (starts with `rediss://`)

---

## STEP 6: Set Environment Variables (10 minutes)

### Method 1: Via Railway Dashboard (Recommended)

```bash
# Open Railway dashboard
railway open
```

Then:
1. Click on your service
2. Go to "Variables" tab
3. Click "Raw Editor" button
4. Copy and paste ALL content from `railway-env-template.txt`
5. **IMPORTANT**: Update these values:
   - `REDIS_URL` - Your Upstash Redis URL
   - `APP_URL` - Will update after first deployment
   - `ADMIN_CORS_ORIGIN` - Will update after Vercel deployment

### Method 2: Via CLI (Alternative)

```bash
# Set individual variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set ADMIN_JWT_SECRET="d3d53e86169e1b462120942f0e0d3cc367a290fe0914c8a621f951d184da0db2"
# ... (copy all from railway-env-template.txt)
```

---

## STEP 7: Deploy API to Railway (5-10 minutes)

```bash
# From project root
railway up
```

⏳ **Wait for deployment** - This will:
1. Build Docker image (5-8 minutes)
2. Run database migrations
3. Start the server

**Watch logs:**
```bash
railway logs --tail
```

---

## STEP 8: Get Railway URL and Update Environment (2 minutes)

```bash
# Get your Railway URL
railway status
```

Copy the URL (e.g., `https://trustescrow-ng-production.up.railway.app`)

**Update environment variables:**

```bash
# Method 1: Via CLI
railway variables set APP_URL="https://YOUR-RAILWAY-URL"

# Method 2: Via Dashboard
railway open
# Update APP_URL in Variables tab
```

---

## STEP 9: Verify API Deployment (2 minutes)

```bash
# Test health endpoint
curl https://YOUR-RAILWAY-URL/health
```

**Expected response:**
```json
{
  "status": "ok",
  "db": "connected",
  "time": "2026-06-05T..."
}
```

If you get an error, check logs:
```bash
railway logs
```

---

## STEP 10: Deploy Admin to Vercel (5 minutes)

### Install Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

### Deploy Admin Dashboard

```bash
# Navigate to admin directory
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# Deploy to production
vercel --prod
```

**When prompted:**
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name: **trustescrow-admin**
- Directory: **./  (current directory)**
- Override settings? **No**

⏳ **Wait 3-5 minutes** for deployment

---

## STEP 11: Configure Admin Environment (3 minutes)

```bash
# Add API URL environment variable
vercel env add NEXT_PUBLIC_API_URL production

# Enter value: https://YOUR-RAILWAY-URL

# Redeploy with environment variable
vercel --prod
```

Copy your Vercel URL from the deployment output

---

## STEP 12: Update CORS (3 minutes)

```bash
# Update CORS in Railway
railway variables set ADMIN_CORS_ORIGIN="https://YOUR-VERCEL-URL"

# Redeploy Railway
railway up
```

---

## STEP 13: Test Everything (5 minutes)

### Test API Health
```bash
curl https://YOUR-RAILWAY-URL/health
```

### Test Admin Dashboard

1. Open: `https://YOUR-VERCEL-URL`
2. You should see the login page
3. Login with credentials:
   - Username: `admin`
   - Password: `wGc9DH2xPkqobvj3jYQw` (from railway-env-template.txt)

4. Check dashboard loads with metrics
5. Navigate to Deals, Disputes, Users pages
6. Check browser console for errors (should be none)

### Test Admin API Connection

In admin dashboard:
1. Dashboard should show metrics (may be zero if no data)
2. Deals page should load (empty list)
3. No CORS errors in console

---

## ✅ DEPLOYMENT COMPLETE!

Your TrustEscrow NG is now live! 🎉

**URLs:**
- **API**: `https://YOUR-RAILWAY-URL`
- **Admin**: `https://YOUR-VERCEL-URL`

**Admin Login:**
- Username: `admin`
- Password: `wGc9DH2xPkqobvj3jYQw`

---

## 📊 Post-Deployment Checklist

### Immediate Actions
- [ ] Bookmark API and Admin URLs
- [ ] Save admin credentials in password manager
- [ ] Test login to admin dashboard
- [ ] Verify no errors in Railway logs
- [ ] Verify no errors in Vercel logs

### Within 24 Hours
- [ ] Monitor Railway logs for errors
- [ ] Test SMS integration (if AT credentials are active)
- [ ] Test payment flow (Paystack test mode)
- [ ] Check Bull Board queue: `https://YOUR-RAILWAY-URL/admin/queues`

### Before Production Use
- [ ] Replace AT credentials with live keys
- [ ] Replace Paystack test keys with live keys
- [ ] Replace Prembly sandbox with live credentials
- [ ] Set `USE_MOCK_NIN=false`
- [ ] Change admin password from dashboard
- [ ] Configure webhooks:
  - Paystack: `https://YOUR-RAILWAY-URL/api/webhooks/paystack`
  - Africa's Talking: `https://YOUR-RAILWAY-URL/api/sms/inbound`

---

## 🐛 Troubleshooting

### Railway Build Failed

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing dependencies: Check package.json
- Database connection: Verify PostgreSQL is added
- Environment variables: Check all are set

**Solution:**
```bash
# Rebuild
railway up --force
```

### Admin Can't Connect to API

**Check:**
1. CORS is set correctly in Railway
2. API URL is set in Vercel
3. Both deployments completed successfully

**Fix:**
```bash
# Verify CORS
railway variables get ADMIN_CORS_ORIGIN

# Verify Vercel env
cd apps/admin
vercel env ls

# Update if needed
railway variables set ADMIN_CORS_ORIGIN="https://YOUR-VERCEL-URL"
```

### Health Check Returns 500

**Check database:**
```bash
railway logs --filter="database"
```

**Run migrations manually:**
```bash
railway run npx prisma migrate deploy
```

### Can't Login to Admin

**Verify:**
1. Admin credentials in Railway: `railway variables get ADMIN_USERS`
2. JWT secret is set: `railway variables get ADMIN_JWT_SECRET`
3. Check browser console for errors

---

## 🔄 Redeployment Commands

```bash
# Redeploy API (Railway)
railway up

# Redeploy Admin (Vercel)
cd apps/admin && vercel --prod

# View Railway logs
railway logs --tail

# View Vercel logs
vercel logs
```

---

## 📈 Monitoring

### Railway Dashboard
```bash
railway open
```
View: CPU, Memory, Requests, Response times

### Bull Board (Job Queue)
```
https://YOUR-RAILWAY-URL/admin/queues
```
View: SMS jobs, Payment jobs, Timer jobs

### Logs
```bash
# Railway (API)
railway logs --tail

# Vercel (Admin)
vercel logs --follow
```

---

## 🎯 Next Steps

1. **Test thoroughly** - Click through all admin pages
2. **Monitor for 24 hours** - Watch for errors
3. **Plan credential swap** - Get live API keys ready
4. **Document your URLs** - Share with team
5. **Set up monitoring** - Configure Sentry (optional)

---

## 💡 Quick Reference

```bash
# Railway commands
railway login              # Login
railway init              # Create project
railway add               # Add services
railway variables         # Manage env vars
railway up                # Deploy
railway logs              # View logs
railway open              # Open dashboard
railway status            # Get URLs

# Vercel commands
vercel login              # Login
vercel --prod             # Deploy to production
vercel env                # Manage env vars
vercel logs               # View logs
vercel domains            # Manage domains
```

---

**You're deployed! Time to test and celebrate! 🚀**

*Deployed using development credentials - remember to swap for production keys*
