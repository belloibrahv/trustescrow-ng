# Railway Deployment Checklist - Fix "Pre-deploy command failed"

## 🔍 Issue Analysis
The deployment is failing at the "Pre-deploy command" stage, which typically means:
1. PostgreSQL database is not available or not added to the project
2. Environment variables are missing or incorrect
3. Prisma migrations can't connect to the database

## ✅ Required Steps (Do These Now)

### 1. **Add PostgreSQL Database** (CRITICAL)
In your Railway dashboard:
1. Click your project
2. Click "New" → "Database" → "PostgreSQL"  
3. Wait for PostgreSQL to deploy (2-3 minutes)
4. Railway will auto-inject `DATABASE_URL` variable

**Without this, migrations will fail!**

### 2. **Set Environment Variables**
Copy all variables from `railway-variables-to-paste.txt`:
1. Go to Railway → Your API service → "Variables"
2. Click "Raw Editor" 
3. Paste all variables from the file
4. Make sure `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### 3. **Update App URL** (After deployment)
Once deployed:
1. Copy your Railway URL (e.g., `https://abc123.up.railway.app`)
2. Update these variables:
   ```
   APP_URL=https://your-railway-url.up.railway.app
   ```

### 4. **Verify Database Connection**
After adding PostgreSQL, check:
- Railway dashboard shows PostgreSQL as "Active"
- `DATABASE_URL` variable shows `${{Postgres.DATABASE_URL}}`

## 🚀 Deployment Process

### Step 1: Prerequisites
- ✅ PostgreSQL database added
- ✅ All environment variables set
- ✅ Redis URL is correct (Upstash)

### Step 2: Commit & Push
The latest fixes have been applied:
```bash
git add -A
git commit -m "Fix Railway deployment: simplify Dockerfile and handle database properly"  
git push
```

### Step 3: Monitor Build
1. Railway will detect the new commit
2. Build should complete successfully  
3. Deploy should succeed if database is ready

## 🔧 What Was Fixed

1. **Simplified Dockerfile** - Removed complex startup scripts
2. **Proper Migration Handling** - Migrations run via Railway's start command
3. **Better Working Directory** - Fixed path issues
4. **User Permissions** - Proper ownership setup

## 🚨 Common Issues & Solutions

### "Pre-deploy command failed" 
**Cause**: No PostgreSQL database
**Fix**: Add PostgreSQL database service in Railway

### "Database connection error"
**Cause**: Wrong DATABASE_URL or database not ready
**Fix**: Ensure `DATABASE_URL=${{Postgres.DATABASE_URL}}`

### "Migration failed"
**Cause**: Database schema issues
**Fix**: Let first migration fail, then redeploy (Railway will create tables)

### "Redis connection error"  
**Cause**: Wrong Redis URL
**Fix**: Verify Upstash Redis URL is correct

## ✅ Success Indicators

When deployment works:
1. ✅ Build completes 
2. ✅ Deploy succeeds (no pre-deploy errors)
3. ✅ Health check passes
4. ✅ Service shows "Active"

## 🔗 Test Deployment

After successful deployment:
```bash
# Replace with your actual Railway URL
curl https://your-railway-url.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-06-06T...",
  "env": "production", 
  "db": "connected",
  "redis": "connected"
}
```

## 📞 Next Steps After Success

1. **Get Railway URL** from dashboard
2. **Update APP_URL** environment variable  
3. **Deploy admin dashboard** to Vercel
4. **Update CORS settings** with Vercel URL
5. **Test API endpoints**

---

## 🎯 Action Required NOW

1. **Add PostgreSQL database** in Railway dashboard
2. **Verify all environment variables** are set
3. **Wait for next deployment** to complete

The main fix is adding the PostgreSQL database - without it, Prisma migrations will always fail during the pre-deploy phase.