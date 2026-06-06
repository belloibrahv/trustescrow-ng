# 🚀 START YOUR DEPLOYMENT HERE

**Welcome!** You're about to deploy TrustEscrow NG to production (using dev credentials for now).

---

## ⚡ Quick Start (Choose One)

### Option 1: Automated (Recommended) ⭐

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

**Time:** 30-45 minutes  
**Difficulty:** Easy (script guides you through everything)

### Option 2: Manual

Follow: `DEPLOY_WITH_DEV_CREDENTIALS.md`

**Time:** 60+ minutes  
**Difficulty:** Medium (step-by-step manual commands)

---

## 📋 Before You Start

### 1. Do This First! (Critical)

**Create Upstash Redis** (5 minutes)

You MUST have this before running the deployment script!

1. Go to: https://upstash.com
2. Sign up / Login
3. Click "Create Database"
4. Name: `trustescrow-redis-dev`
5. Region: Choose closest to you
6. TLS: ✅ Enabled
7. Click "Create"
8. **Copy the Redis URL** - looks like:
   ```
   rediss://default:abc123...@us1-xyz.upstash.io:6379
   ```
9. **Save it** - you'll need to paste it when the script asks

### 2. Verify Tools

```bash
node -v        # Should be v20+
railway --version   # Should show version
vercel --version    # Should show version
```

All tools are already installed ✅

---

## 🎯 Run the Deployment

### Ready? Let's go!

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

### What Will Happen

The script will:
1. ✅ Check your system
2. ✅ Ask for your Upstash Redis URL (paste it!)
3. ✅ Login to Railway (browser opens)
4. ✅ Create Railway project
5. ✅ Add PostgreSQL database
6. ✅ Set all environment variables
7. ✅ Deploy API (wait 5-10 minutes)
8. ✅ Get your Railway URL (copy it!)
9. ✅ Login to Vercel (browser opens)
10. ✅ Deploy Admin Dashboard
11. ✅ Configure everything
12. ✅ Test health endpoints
13. ✅ Show you your URLs

### During Deployment

**You'll be asked for:**
- Upstash Redis URL (paste the one you saved)
- Railway URL (copy from terminal output)
- Vercel URL (copy from terminal output)

**Just follow the prompts!** The script tells you exactly what to do.

---

## ✅ After Deployment

### 1. Test Your API

```bash
curl https://your-railway-url.up.railway.app/health
```

Should return:
```json
{"status":"ok","db":"connected","redis":"connected"}
```

### 2. Test Your Admin

1. Open: `https://your-vercel-url.vercel.app`
2. Login: `admin` / `admin123`
3. You should see the dashboard!

### 3. Configure Webhooks

See: `DEPLOYMENT_CHECKLIST_SIMPLE.md` - Step 4

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `START_DEPLOYMENT_HERE.md` | **You are here!** | Start here |
| `QUICK_DEPLOY_GUIDE.md` | Quick reference | Fast overview |
| `DEPLOY_WITH_DEV_CREDENTIALS.md` | Complete guide | Detailed instructions |
| `DEPLOYMENT_CHECKLIST_SIMPLE.md` | Printable checklist | Track progress |
| `DEPLOYMENT_TROUBLESHOOTING.md` | Fix issues | When things break |
| `deploy-now.sh` | Automated script | Run this! |

---

## 🆘 Need Help?

### Common Issues

**Issue:** Script fails at Redis connection
**Fix:** Check your Redis URL format (should start with `rediss://`)

**Issue:** Health check fails
**Fix:** Run `railway logs --tail` to see what's wrong

**Issue:** Can't login to admin
**Fix:** Check browser console (F12) for CORS errors

### Get Detailed Help

1. Check logs: `railway logs --tail`
2. Review: `DEPLOYMENT_TROUBLESHOOTING.md`
3. Check status: `railway status`

---

## 💰 What You're Deploying

| Component | Platform | Cost |
|-----------|----------|------|
| API Server | Railway | ~$5/month |
| PostgreSQL | Railway | Included |
| Redis | Upstash | Free |
| Admin Dashboard | Vercel | Free |
| **Total** | | **~$5/month** |

---

## ⚠️ Important Notes

**Current Setup:**
- Using Africa's Talking **sandbox** mode
- Using Paystack **test** keys
- Using **development** passwords
- DO NOT use for real transactions yet!

**Production Ready Checklist:**
- [ ] Switch to production API keys
- [ ] Change admin password
- [ ] Use production Prembly credentials
- [ ] Enable monitoring
- [ ] Setup alerts
- [ ] Test thoroughly

---

## 🎬 Let's Deploy!

### Ready to start?

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

### Timeline

- ⏱️ **Total time:** 30-45 minutes
- 🔧 **Your involvement:** ~10 minutes (mostly waiting)
- 🤖 **Automation:** ~30 minutes (script does the work)

### What You'll Get

After running the script:
- ✅ Live API server with database
- ✅ Live admin dashboard
- ✅ Working authentication
- ✅ Configured webhooks
- ✅ Complete deployment info saved
- ✅ All URLs ready to use

---

## 📍 Your Deployment Info

After deployment, you'll get:

**API URL:**
```
https://_________________.up.railway.app
```

**Admin URL:**
```
https://_________________.vercel.app
```

**Credentials:**
- Username: `admin`
- Password: `admin123`

**Dashboards:**
- Railway: https://railway.app/dashboard
- Vercel: https://vercel.com/dashboard
- Upstash: https://console.upstash.com

---

## 🎉 Ready to Rock!

Everything is prepared. Just run:

```bash
cd /Users/kudiratbello/trustescrow-ng
bash deploy-now.sh
```

**The script will guide you through everything!**

Good luck! 🚀

---

## 📞 Quick Reference

```bash
# Start deployment
bash deploy-now.sh

# View logs
railway logs --tail

# Redeploy API
railway up

# Redeploy Admin
cd apps/admin && vercel --prod

# Open dashboards
railway open  # Railway
# https://vercel.com/dashboard  # Vercel
```

---

**Deployment Guide - June 6, 2026**  
**Status: Ready to Deploy**  
**Credentials: Development Mode**  

🚀 **START NOW:** `bash deploy-now.sh`
