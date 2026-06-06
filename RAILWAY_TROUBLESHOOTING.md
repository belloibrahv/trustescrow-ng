# Railway Deployment Troubleshooting

## 🚨 Critical Issue Identified

Even a simple Node.js HTTP server is failing, indicating a Railway environment/configuration issue, NOT a code problem.

## ✅ Required Railway Setup Checklist

### **1. PostgreSQL Database Service**
**CRITICAL**: You must have a PostgreSQL service in your Railway project.

**Steps to Add:**
1. Railway Dashboard → Your Project
2. Click "**New**" → "**Database**" → "**PostgreSQL**"
3. Wait 2-3 minutes for it to deploy
4. Railway will auto-inject `DATABASE_URL` variable

**Without PostgreSQL, the API service will fail!**

### **2. Environment Variables Setup**
Go to API Service → Variables → Raw Editor, paste EXACTLY:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://placeholder.railway.app
LOG_LEVEL=info
ADMIN_JWT_SECRET=5dcd6b12614b43103d54f8b822dfa51fe3cff8c52bf8390e604e7cbd6d7acd5f
ENCRYPTION_KEY=350498d24b8d2ac5de614a99f970574b2d5a984bdec0ff60a4fb50fe19f07231350498d24b8d2ac5de614a99f970574b2d5a984bdec0ff60a4fb50fe19f07231
NIN_SALT=bbdbd612afc6d0b96b010df02e0afcce
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=rediss://default:gQAAAAAAAjKeAAIgcDJjYzMyMmNiNmVlMjY0MDljOWQzNmRjMDg3MDNkOWYyNw@vocal-monarch-144030.upstash.io:6379
AT_USERNAME=sandbox
AT_API_KEY=atsk_a79f6c8a24a0eaa90fd9e44688a498bf4304eecf34a4673096f831eef6236d01b55346c9
AT_SHORTCODE=96207
AT_SENDER_ID=TRUSTESCROW
PAYSTACK_SECRET_KEY=sk_test_37780b726b59580bca6a7084a5424622aa7054f7
PAYSTACK_PUBLIC_KEY=pk_test_ec5ed34324eb8df91a9f02c494da3efb9ca01699
PAYSTACK_WEBHOOK_SECRET=sk_test_37780b726b59580bca6a7084a5424622aa7054f7
PAYSTACK_DVA_PROVIDER=wema-bank
PREMBLY_API_KEY=live_sk_2c9575f35064468ab1a056903afa02bc
PREMBLY_APP_ID=sandbox_app123
PREMBLY_BASE_URL=https://sandbox.prembly.com
AI_PROVIDER=groq
GROQ_API_KEY=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
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MAX_TOKENS=1024
CLAUDE_MODEL=claude-sonnet-4-6
CLAUDE_MAX_TOKENS=1024
GITHUB_TOKEN=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
DEEPSEEK_API_KEY=sk-0265edcd2d494e6f8eaa997075321995
USE_MOCK_NIN=true
USE_MOCK_PAYSTACK=false
LIVENESS_THRESHOLD_KOBO=50000000
DVA_EXPIRY_DAYS=7
DISPUTE_AUTO_ESCALATE_HOURS=48
MAX_NIN_ATTEMPTS=3
DEAL_VALUE_CAP_KOBO=0
```

### **3. Service Settings Verification**
API Service → Settings:

- **Dockerfile Path**: `apps/api/Dockerfile` ✅
- **Pre-Deploy Command**: (must be EMPTY) ✅
- **Build Command**: (leave default) ✅
- **Health Check Path**: `/health` ✅

## 🔧 Alternative Solution: Fresh Start

If the above doesn't work, try creating a completely new Railway project:

### **Method 1: New Railway Project**
1. **Delete current Railway service** (keep database if you want data)
2. **Create new project** from scratch
3. **Deploy from GitHub** → Select your repo
4. **Add PostgreSQL** database
5. **Set environment variables**

### **Method 2: Railway Template Deploy**
Use Railway's one-click deploy:
1. Go to: https://railway.app/new
2. Deploy from GitHub repo
3. Connect `belloibrahv/trustescrow-ng`
4. Railway handles the rest

## 🚨 Most Likely Issues

### **Issue 1: Missing PostgreSQL**
**Symptoms**: `DATABASE_URL` errors, service won't start
**Fix**: Add PostgreSQL database service

### **Issue 2: Wrong Environment Variables**  
**Symptoms**: Validation errors, service crashes
**Fix**: Use exact variables from above

### **Issue 3: Railway Region Issues**
**Symptoms**: Random deployment failures
**Fix**: Try different Railway region or contact Railway support

### **Issue 4: Resource Limits**
**Symptoms**: Service starts then dies
**Fix**: Check Railway plan limits, upgrade if needed

## 🎯 Verification Steps

After fixing the setup:

1. **Check Services**: Should see both API and PostgreSQL services
2. **Check Variables**: `DATABASE_URL` should show `${{Postgres.DATABASE_URL}}`
3. **Check Logs**: Should see our debug output
4. **Test Health**: `curl https://your-url.up.railway.app/health`

## 📞 Railway Support

If all else fails, contact Railway support with:
- Project ID
- Error logs
- Mention "simple Node.js HTTP server failing"
- They can check for platform issues

---

**Bottom Line**: If a basic Node.js server can't run, it's definitely a Railway configuration issue, not our code!