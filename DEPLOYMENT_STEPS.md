# 🚀 TrustEscrow NG - Live Deployment Steps

Follow these steps in your terminal. Copy and paste each command.

---

## ✅ STEP 1: Login to Railway (Do this now!)

```bash
railway login
```

**Action**: Browser will open → Sign up/Login → Authenticate

---

## ✅ STEP 2: Initialize Railway Project

```bash
cd /Users/kudiratbello/trustescrow-ng
railway init
```

**When prompted:**
- Project name: `trustescrow-ng-staging` (or any name you prefer)
- Choose: Create new project

---

## ✅ STEP 3: Add PostgreSQL Database

```bash
railway add --database postgres
```

**Note**: Railway will automatically configure DATABASE_URL

---

## ✅ STEP 4: Open Railway Dashboard

```bash
railway open
```

**In the Dashboard:**
1. Click on your service (should be the only one)
2. Go to **"Variables"** tab
3. Click **"Raw Editor"** button (top right)
4. Open the file: `railway-env-template.txt` in your code editor
5. Copy ALL content from that file
6. Paste into Railway's Raw Editor
7. Click **"Save"**

**⚠️ BEFORE SAVING - Update these two values:**
- `REDIS_URL` - (we'll get this from Upstash in next step)
- For now, leave as is and we'll update after Upstash setup

---

## ✅ STEP 5: Create Upstash Redis (Quick!)

Open in browser: [https://console.upstash.com](https://console.upstash.com)

1. Sign up/Login (use GitHub for speed)
2. Click **"Create Database"**
3. Name: `trustescrow-redis`
4. Type: **Regional**
5. Region: Choose closest to you (US-East or Europe)
6. Click **"Create"**
7. Copy the **"TLS (External)" URL** (starts with `rediss://`)

**Then:**
```bash
# Update Redis URL in Railway
railway variables set REDIS_URL="your-upstash-redis-url"
```

---

## ✅ STEP 6: Deploy API to Railway

```bash
railway up
```

**What happens:**
- Builds Docker image (5-8 minutes)
- Runs database migrations
- Starts the server

**Watch progress:**
```bash
# In another terminal, watch logs
railway logs --tail
```

**Wait for**: Build complete and service running

---

## ✅ STEP 7: Get Your Railway URL

```bash
railway status
```

**Copy the URL** (looks like: `trustescrow-ng-staging.up.railway.app`)

**Update APP_URL:**
```bash
railway variables set APP_URL="https://your-railway-url.up.railway.app"
```

---

## ✅ STEP 8: Test API Health

```bash
curl https://your-railway-url.up.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "db": "connected",
  "time": "2026-06-05T..."
}
```

If error, check logs:
```bash
railway logs
```

---

## ✅ STEP 9: Deploy Admin Dashboard to Vercel

```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin
vercel --prod
```

**When prompted:**
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name: **trustescrow-admin**
- Directory: **./ (just press Enter)**
- Override settings? **No**

**Copy the Vercel URL** from the output

---

## ✅ STEP 10: Configure Admin Environment

```bash
# Set API URL for admin
vercel env add NEXT_PUBLIC_API_URL production

# When prompted, enter: https://your-railway-url.up.railway.app

# Redeploy with environment variable
vercel --prod
```

---

## ✅ STEP 11: Update CORS in Railway

```bash
# Update CORS to allow admin dashboard
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url.vercel.app"

# Redeploy
railway up
```

---

## ✅ STEP 12: Test Everything!

### Test API:
```bash
curl https://your-railway-url.up.railway.app/health
```

### Test Admin:
Open in browser: `https://your-vercel-url.vercel.app`

**Login with:**
- Username: `admin`
- Password: `wGc9DH2xPkqobvj3jYQw`

**Check:**
- ✅ Login works
- ✅ Dashboard loads
- ✅ Can navigate to Deals, Disputes, Users
- ✅ No CORS errors in browser console

---

## 🎉 Deployment Complete!

**Your URLs:**
- **API**: `https://your-railway-url.up.railway.app`
- **Admin**: `https://your-vercel-url.vercel.app`

**Save these credentials:**
- Admin username: `admin`
- Admin password: `wGc9DH2xPkqobvj3jYQw`
- Operator username: `operator`
- Operator password: `82m5lmbz6sVEE87FHeZA`

---

## 📊 Monitor Your Deployment

```bash
# View Railway logs
railway logs --tail

# View Railway metrics
railway open  # Click "Metrics" tab

# View Vercel logs
cd apps/admin
vercel logs --follow

# Check Bull Board (job queues)
# Open: https://your-railway-url.up.railway.app/admin/queues
```

---

## 🐛 Troubleshooting

### Railway build failed
```bash
railway logs
# Look for error, then:
railway up --force
```

### Admin can't connect to API
```bash
# Check CORS is set
railway variables get ADMIN_CORS_ORIGIN

# Update if needed
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url"
railway up
```

### Health check fails
```bash
# Run migrations manually
railway run npx prisma migrate deploy

# Check database connection
railway logs --filter="database"
```

---

## ⚠️ Before Production Use

Remember you're using **development credentials**. Before processing real transactions:

1. Get live API keys from:
   - Africa's Talking
   - Paystack
   - Prembly

2. Update in Railway:
```bash
railway variables set AT_API_KEY="your-live-key"
railway variables set PAYSTACK_SECRET_KEY="sk_live_..."
railway variables set PREMBLY_API_KEY="your-live-key"
railway variables set USE_MOCK_NIN=false
railway up
```

3. Configure webhooks:
   - Paystack: `https://your-railway-url/api/webhooks/paystack`
   - Africa's Talking: `https://your-railway-url/api/sms/inbound`

---

**Now start with STEP 1 above! 🚀**
