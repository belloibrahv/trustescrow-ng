# TrustEscrow NG - Deployment Troubleshooting Guide

Common issues and how to fix them quickly.

---

## 🔴 API Issues

### Issue: Health check fails

**Symptoms:**
```bash
curl https://your-railway-url.up.railway.app/health
# Returns 502 Bad Gateway or timeout
```

**Diagnosis:**
```bash
# Check logs
railway logs --tail
```

**Common Causes & Fixes:**

#### 1. Database Connection Failed
**Look for:** `Error connecting to database`

**Fix:**
```bash
# Verify DATABASE_URL is set
railway variables get DATABASE_URL

# Should show: postgresql://...
# If missing, PostgreSQL wasn't added properly
railway add --database postgres
```

#### 2. Redis Connection Failed
**Look for:** `Error connecting to Redis`

**Fix:**
```bash
# Check Redis URL
railway variables get REDIS_URL

# Should start with rediss:// (double 's')
# If wrong format, update:
railway variables set REDIS_URL="your-correct-upstash-url"
```

#### 3. Build Failed
**Look for:** `Build failed` or `npm install` errors

**Fix:**
```bash
# Check Node.js version in Railway matches local
# Local version:
node -v

# Update Railway Node version if needed in railway.toml
# Or set environment variable:
railway variables set NODE_VERSION=20
```

#### 4. Migrations Failed
**Look for:** `Prisma migrate failed`

**Fix:**
```bash
# Manually run migrations
railway run npx prisma migrate deploy

# Or reset database (WARNING: deletes data)
railway run npx prisma migrate reset --force
```

---

## 🔴 Admin Dashboard Issues

### Issue: Admin page shows blank screen

**Symptoms:**
- White/blank page
- Browser console shows errors
- No content loads

**Diagnosis:**
```bash
# Check browser console (F12)
# Look for errors
```

**Common Causes & Fixes:**

#### 1. API URL Not Set
**Look for:** `NEXT_PUBLIC_API_URL is not defined`

**Fix:**
```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# Set API URL
vercel env add NEXT_PUBLIC_API_URL production

# When prompted, enter your Railway URL:
# https://your-railway-url.up.railway.app

# Redeploy
vercel --prod
```

#### 2. CORS Error
**Look for:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Fix:**
```bash
cd /Users/kudiratbello/trustescrow-ng

# Set CORS origin
railway variables set ADMIN_CORS_ORIGIN="https://your-vercel-url.vercel.app"

# Redeploy API
railway up
```

#### 3. Build Failed
**Look for:** Build errors in Vercel logs

**Fix:**
```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin

# Test build locally
npm run build

# If successful, redeploy
vercel --prod

# If fails locally, fix TypeScript/build errors first
```

---

## 🔴 Authentication Issues

### Issue: Can't login to admin

**Symptoms:**
- Login button does nothing
- "Invalid credentials" message
- Login succeeds but redirects back

**Common Causes & Fixes:**

#### 1. Wrong Credentials
**Fix:**
```bash
# Default credentials:
Username: admin
Password: admin123

# Verify in Railway:
railway variables get ADMIN_USERS
# Should show: {"admin":"admin123","operator":"operator456"}
```

#### 2. JWT Secret Not Set
**Look for:** Console error about JWT

**Fix:**
```bash
railway variables get ADMIN_JWT_SECRET
# Should return a long hex string

# If missing:
railway variables set ADMIN_JWT_SECRET=5dcd6b12614b43103d54f8b822dfa51fe3cff8c52bf8390e604e7cbd6d7acd5f
```

#### 3. Session/Cookie Issues
**Fix:**
- Clear browser cookies
- Try incognito/private window
- Try different browser

---

## 🔴 Redis Issues

### Issue: Redis connection errors

**Symptoms:**
```
Error: getaddrinfo ENOTFOUND
Error: connect ETIMEDOUT
```

**Common Causes & Fixes:**

#### 1. Wrong Redis URL Format
**Fix:**
```bash
railway variables get REDIS_URL

# Should start with: rediss:// (note double 's' for TLS)
# Example: rediss://default:password@host.upstash.io:6379

# If wrong:
railway variables set REDIS_URL="rediss://..."
```

#### 2. Upstash Redis Not Active
**Fix:**
1. Go to https://console.upstash.com
2. Check database status is "Active"
3. If suspended, may need to upgrade plan or check limits

#### 3. TLS Issues
**Fix:**
- Ensure Upstash Redis has TLS enabled
- Ensure URL uses `rediss://` not `redis://`

---

## 🔴 SMS/Webhook Issues

### Issue: SMS not being received

**Symptoms:**
- Send "START" SMS
- No response received
- No logs in Railway

**Diagnosis:**
```bash
# Check Railway logs
railway logs | grep -i "sms"
```

**Common Causes & Fixes:**

#### 1. Callback URL Not Set
**Fix:**
1. Go to https://account.africastalking.com/
2. Navigate to SMS → Callback URLs
3. Set: `https://your-railway-url.up.railway.app/api/sms/inbound`
4. Save

#### 2. Using Wrong Shortcode
**Fix:**
- Dev mode shortcode: `96207`
- Sandbox mode: Use Africa's Talking Simulator
- URL: https://simulator.africastalking.com/

#### 3. Africa's Talking API Key Invalid
**Fix:**
```bash
# Verify API key is set
railway variables get AT_API_KEY

# Should start with: atsk_...
# Get correct key from: https://account.africastalking.com/
```

### Issue: Paystack webhook not working

**Diagnosis:**
```bash
railway logs | grep -i "webhook"
```

**Common Causes & Fixes:**

#### 1. Webhook URL Not Configured
**Fix:**
1. Go to https://dashboard.paystack.com/#/settings/developer
2. Click "Webhooks"
3. Add: `https://your-railway-url.up.railway.app/api/webhooks/paystack`

#### 2. Webhook Secret Mismatch
**Fix:**
```bash
railway variables get PAYSTACK_WEBHOOK_SECRET
# Should match PAYSTACK_SECRET_KEY in test mode

railway variables set PAYSTACK_WEBHOOK_SECRET=sk_test_...
```

---

## 🔴 Environment Variable Issues

### Issue: Environment variables not set

**Diagnosis:**
```bash
# List all variables
railway variables list

# Check specific variable
railway variables get VARIABLE_NAME
```

**Fix:**
```bash
# Set missing variable
railway variables set VARIABLE_NAME="value"

# Or set multiple using Raw Editor:
railway open
# Go to Variables → Raw Editor → Paste all variables
```

### Issue: Variables not taking effect

**Fix:**
```bash
# After setting variables, redeploy:
railway up

# Or restart the service:
railway restart
```

---

## 🔴 Deployment Failures

### Issue: Railway deployment fails

**Symptoms:**
- Build fails
- Deployment crashes
- Service won't start

**Diagnosis:**
```bash
# View build logs
railway logs

# Check service status
railway status
```

**Common Causes & Fixes:**

#### 1. Out of Memory
**Look for:** `JavaScript heap out of memory`

**Fix:**
```bash
# Increase memory limit
railway variables set NODE_OPTIONS="--max-old-space-size=2048"
```

#### 2. Port Issues
**Look for:** `Port already in use`

**Fix:**
```bash
# Ensure using PORT from environment
railway variables get PORT
# Should be: 3000

# Verify code uses process.env.PORT
```

#### 3. Docker Build Issues
**Look for:** Dockerfile errors

**Fix:**
```bash
# Test Dockerfile locally
cd /Users/kudiratbello/trustescrow-ng
docker build -f apps/api/Dockerfile .

# Fix any errors in Dockerfile
```

---

## 🔴 Performance Issues

### Issue: API is slow

**Diagnosis:**
```bash
# Check Railway metrics
railway open
# View CPU, memory, response times
```

**Common Causes & Fixes:**

#### 1. Database Queries Slow
**Fix:**
- Check for missing indexes
- Review Prisma queries
- Consider connection pooling

#### 2. Redis Not Caching
**Fix:**
```bash
# Verify Redis is connected
railway logs | grep -i "redis"
```

#### 3. Railway Resource Limits
**Fix:**
- Upgrade Railway plan
- Optimize code
- Review resource usage

---

## 🔴 Database Issues

### Issue: Database errors

**Symptoms:**
```
PrismaClientKnownRequestError
Database connection error
```

**Diagnosis:**
```bash
railway logs | grep -i "prisma"
```

**Common Causes & Fixes:**

#### 1. Database Not Provisioned
**Fix:**
```bash
# Add PostgreSQL
railway add --database postgres

# Verify it was added
railway status
```

#### 2. Migrations Not Run
**Fix:**
```bash
# Run migrations manually
railway run npx prisma migrate deploy

# Or redeploy (migrations run automatically)
railway up
```

#### 3. Connection Pool Exhausted
**Look for:** `Too many clients`

**Fix:**
```bash
# Reduce connection limit in Prisma schema
# Or upgrade database plan
```

---

## 🔴 Vercel Issues

### Issue: Vercel deployment fails

**Diagnosis:**
```bash
cd /Users/kudiratbello/trustescrow-ng/apps/admin
vercel logs
```

**Common Causes & Fixes:**

#### 1. Build Timeout
**Fix:**
```bash
# Build locally first to catch errors
npm run build

# If successful, redeploy
vercel --prod
```

#### 2. Environment Variables Missing
**Fix:**
```bash
# List environment variables
vercel env ls

# Add missing variable
vercel env add VARIABLE_NAME production
```

#### 3. Next.js Configuration Issues
**Fix:**
- Check `next.config.js`
- Ensure all dependencies installed
- Check Node.js version compatibility

---

## 🛠️ General Debugging Commands

```bash
# Railway
railway logs --tail          # Live logs
railway logs | grep ERROR    # Filter errors
railway status               # Service status
railway variables list       # List all variables
railway open                 # Open dashboard
railway restart              # Restart service

# Vercel
vercel logs                  # View logs
vercel logs --follow         # Live logs
vercel env ls                # List env vars
vercel inspect               # Deployment details

# Local Testing
npm run dev                  # Test API locally
npm run dev:admin            # Test admin locally
docker-compose up            # Start local DB/Redis
npm test                     # Run tests
```

---

## 🔄 Quick Recovery Commands

### Reset Everything (Nuclear Option)

```bash
# WARNING: This will delete all data!

# 1. Remove Railway project
railway unlink

# 2. Remove Vercel project
cd /Users/kudiratbello/trustescrow-ng/apps/admin
vercel remove trustescrow-admin-dev

# 3. Start fresh
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

### Soft Reset (Keep Data)

```bash
# Redeploy API
cd /Users/kudiratbello/trustescrow-ng
railway up

# Redeploy Admin
cd apps/admin
vercel --prod

# Restart services
railway restart
```

---

## 📞 Still Stuck?

### Check Status Pages

- Railway: https://railway.app/status
- Vercel: https://vercel.com/status  
- Upstash: https://status.upstash.com
- Paystack: https://status.paystack.com
- Africa's Talking: https://status.africastalking.com

### Review Documentation

- Full guide: `DEPLOY_WITH_DEV_CREDENTIALS.md`
- Quick guide: `QUICK_DEPLOY_GUIDE.md`
- Checklist: `DEPLOYMENT_CHECKLIST_SIMPLE.md`

### Get Help

1. Check Railway logs: `railway logs --tail`
2. Check Vercel logs: `vercel logs`
3. Search error message in documentation
4. Check service status pages
5. Review environment variables

---

## 💡 Pro Tips

1. **Always check logs first**
   ```bash
   railway logs --tail
   ```

2. **Verify environment variables**
   ```bash
   railway variables list
   ```

3. **Test locally before deploying**
   ```bash
   npm run dev
   npm test
   ```

4. **Keep deployment info handy**
   - Check `DEPLOYMENT_INFO.txt`
   - Save all URLs and credentials

5. **Monitor after deployment**
   - Check logs regularly first 24 hours
   - Test all features
   - Watch for error patterns

---

**Troubleshooting Guide - June 6, 2026**  
**For TrustEscrow NG Deployment**

Good luck debugging! 🔧
