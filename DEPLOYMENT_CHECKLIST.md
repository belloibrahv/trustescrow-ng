# TrustEscrow NG - Deployment Checklist

Quick checklist for deploying to production. Check off items as you complete them.

---

## Phase 1: Preparation (30 minutes)

### Generate Secrets
- [ ] Run `node generate-secrets.js`
- [ ] Copy secrets to password manager (1Password, LastPass, etc.)
- [ ] Save admin credentials securely

### Collect API Keys
- [ ] Africa's Talking live API key
- [ ] Paystack live secret key
- [ ] Paystack live public key
- [ ] Paystack webhook secret
- [ ] Prembly live API key
- [ ] Prembly app ID
- [ ] Anthropic API key (or alternative AI provider)
- [ ] Twilio account SID (optional)
- [ ] Twilio auth token (optional)
- [ ] Sentry DSN (optional but recommended)

### Create Accounts
- [ ] Railway account: [https://railway.app](https://railway.app)
- [ ] Vercel account: [https://vercel.com](https://vercel.com)
- [ ] Upstash account: [https://upstash.com](https://upstash.com)
- [ ] Sentry account: [https://sentry.io](https://sentry.io) (optional)

---

## Phase 2: Railway Deployment (API) - 30 minutes

### Install & Setup
- [ ] Install Railway CLI: `brew install railway` or `npm i -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Initialize project: `railway init`
- [ ] Name project: `trustescrow-ng-production`

### Add Services
- [ ] Add PostgreSQL: `railway add --database postgres`
- [ ] Add Redis plugin or configure external Upstash

### Configure Upstash Redis (if using external)
- [ ] Create Redis database on Upstash
- [ ] Choose region (Europe/US)
- [ ] Copy Redis URL
- [ ] Save for environment variables

### Set Environment Variables
- [ ] Open Railway dashboard: `railway open`
- [ ] Go to Variables tab
- [ ] Set all variables from your secrets file:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `APP_URL=<will-update-after-deploy>`
  - [ ] `ADMIN_JWT_SECRET`
  - [ ] `ENCRYPTION_KEY`
  - [ ] `NIN_SALT`
  - [ ] `ADMIN_USERS`
  - [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - [ ] `REDIS_URL`
  - [ ] `AT_USERNAME`
  - [ ] `AT_API_KEY`
  - [ ] `AT_SHORTCODE`
  - [ ] `AT_SENDER_ID`
  - [ ] `PAYSTACK_SECRET_KEY`
  - [ ] `PAYSTACK_PUBLIC_KEY`
  - [ ] `PAYSTACK_WEBHOOK_SECRET`
  - [ ] `PAYSTACK_DVA_PROVIDER=wema-bank`
  - [ ] `PREMBLY_API_KEY`
  - [ ] `PREMBLY_APP_ID`
  - [ ] `PREMBLY_BASE_URL=https://api.prembly.com`
  - [ ] `ANTHROPIC_API_KEY` (or alternative)
  - [ ] `CLAUDE_MODEL=claude-sonnet-4-6`
  - [ ] `TWILIO_ACCOUNT_SID` (optional)
  - [ ] `TWILIO_AUTH_TOKEN` (optional)
  - [ ] `TWILIO_FROM_NUMBER` (optional)
  - [ ] `SENTRY_DSN` (optional)
  - [ ] `USE_MOCK_NIN=false`
  - [ ] `USE_MOCK_PAYSTACK=false`
  - [ ] `LIVENESS_THRESHOLD=500000`
  - [ ] `DVA_EXPIRY_DAYS=7`
  - [ ] `DISPUTE_AUTO_ESCALATE_HOURS=48`
  - [ ] `MAX_NIN_ATTEMPTS=3`

### Deploy
- [ ] Deploy: `railway up`
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Copy deployment URL
- [ ] Update `APP_URL` variable with deployment URL

### Verify Deployment
- [ ] Test health endpoint: `curl https://<your-url>/health`
- [ ] Check logs: `railway logs`
- [ ] Verify no errors in deployment

---

## Phase 3: Vercel Deployment (Admin) - 20 minutes

### Install & Setup
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Login: `vercel login`
- [ ] Navigate to admin: `cd apps/admin`

### Deploy
- [ ] Deploy: `vercel --prod`
- [ ] Follow prompts:
  - [ ] Project name: `trustescrow-admin`
  - [ ] Directory: `./`
  - [ ] Framework: Next.js (auto-detected)
- [ ] Copy deployment URL

### Set Environment Variables
- [ ] In Vercel dashboard or CLI:
- [ ] `NEXT_PUBLIC_API_URL=<your-railway-url>`

### Redeploy with Env Vars
- [ ] Redeploy: `vercel --prod`

### Verify Deployment
- [ ] Open admin URL in browser
- [ ] Verify login page loads
- [ ] Try logging in with admin credentials
- [ ] Check dashboard loads
- [ ] Navigate to all pages (Deals, Disputes, Users)

---

## Phase 4: Connect API & Admin (10 minutes)

### Update CORS
- [ ] In Railway dashboard, update:
  - [ ] `ADMIN_CORS_ORIGIN=<your-vercel-url>`
- [ ] Redeploy: `railway up`

### Test Connection
- [ ] Login to admin dashboard
- [ ] Check if API requests work
- [ ] View dashboard metrics
- [ ] Load deals page
- [ ] Check browser console for CORS errors (should be none)

---

## Phase 5: Third-Party Integrations (20 minutes)

### Configure Paystack Webhook
- [ ] Go to Paystack Dashboard → Settings → Webhooks
- [ ] Add webhook URL: `https://<your-railway-url>/api/webhooks/paystack`
- [ ] Test webhook delivery

### Configure Africa's Talking Callback
- [ ] Go to AT Dashboard → SMS → Callback URLs
- [ ] Set callback: `https://<your-railway-url>/api/sms/inbound`
- [ ] Test with sample SMS (send "START" to your shortcode)

### Configure Sentry (Optional)
- [ ] Create Sentry project
- [ ] Copy DSN
- [ ] Add to Railway: `SENTRY_DSN=<your-dsn>`
- [ ] Redeploy: `railway up`
- [ ] Trigger test error to verify

---

## Phase 6: Testing (30 minutes)

### API Tests
- [ ] Health check: `curl https://<your-railway-url>/health`
- [ ] Admin login via Postman or curl
- [ ] Get metrics endpoint (with auth token)

### Admin Dashboard Tests
- [ ] Login with admin credentials
- [ ] Dashboard loads with metrics
- [ ] Deals page loads
- [ ] Deal detail page works
- [ ] Disputes page loads
- [ ] Users search works
- [ ] Logout works

### SMS Integration Test
- [ ] Send "START" SMS to your shortcode
- [ ] Check Railway logs for processing
- [ ] Verify response SMS received
- [ ] Check dashboard for new deal

### Payment Test (Use Paystack Test Mode First!)
- [ ] Create test deal
- [ ] Generate DVA account
- [ ] Send test payment
- [ ] Verify webhook received
- [ ] Check deal status updated

---

## Phase 7: Security Hardening (15 minutes)

### Change Default Passwords
- [ ] Login to admin dashboard
- [ ] Change admin password
- [ ] Change operator password
- [ ] Update password manager

### Verify Security Settings
- [ ] HTTPS enforced (Railway/Vercel automatic)
- [ ] CORS configured correctly
- [ ] Rate limiting active (check logs)
- [ ] JWT expiration working

### Test Security
- [ ] Try accessing API without auth (should fail)
- [ ] Try SQL injection in inputs (should be sanitized)
- [ ] Try XSS in SMS messages (should be sanitized)
- [ ] Verify NIN never logged (check logs)

---

## Phase 8: Monitoring Setup (15 minutes)

### Configure Alerts
- [ ] Railway: Check metrics dashboard
- [ ] Sentry: Configure error alerts
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)

### Set Up Dashboard Access
- [ ] Bookmark admin URL
- [ ] Bookmark Railway dashboard
- [ ] Bookmark Sentry dashboard
- [ ] Share access with team

### Document Everything
- [ ] Save all URLs in team wiki/docs
- [ ] Save credentials in password manager
- [ ] Document deployment process
- [ ] Create runbook for common issues

---

## Phase 9: Go Live! 🚀 (5 minutes)

### Final Checks
- [ ] All services running
- [ ] No errors in logs
- [ ] All tests passed
- [ ] Team notified
- [ ] Documentation complete

### Switch to Live Mode
- [ ] Update all API keys from test to live:
  - [ ] Africa's Talking (sandbox → live)
  - [ ] Paystack (test → live)
  - [ ] Prembly (sandbox → live)
- [ ] Redeploy with live keys
- [ ] Test with real SMS and small payment

### Monitor First 24 Hours
- [ ] Check Railway logs every hour
- [ ] Monitor Sentry for errors
- [ ] Test SMS delivery
- [ ] Test payment flow
- [ ] Be ready to rollback if issues

---

## Phase 10: Post-Launch (Ongoing)

### Week 1
- [ ] Daily monitoring
- [ ] Fix any bugs discovered
- [ ] Gather user feedback
- [ ] Performance tuning

### Week 2+
- [ ] Weekly monitoring
- [ ] Review metrics and analytics
- [ ] Plan feature enhancements
- [ ] Cost optimization

---

## 📞 Emergency Contacts

**If Something Goes Wrong:**

1. **Check Logs**
   - Railway: `railway logs --tail`
   - Vercel: `vercel logs`
   - Sentry: Check dashboard

2. **Rollback if Needed**
   - Railway: Redeploy previous version
   - Vercel: Redeploy previous version

3. **Common Issues**
   - SMS not sending → Check AT credentials and balance
   - Payments failing → Check Paystack webhook configuration
   - Admin can't connect → Check CORS settings
   - High error rate → Check Sentry and Railway logs

---

## 🎉 Success Criteria

Deployment is successful when:
- ✅ API health check returns 200
- ✅ Admin dashboard accessible and functional
- ✅ SMS integration working (test message sent/received)
- ✅ Payment webhook receiving events
- ✅ No errors in Railway/Sentry logs
- ✅ All security measures active
- ✅ Monitoring and alerts configured

---

## 📊 Estimated Timeline

- **Preparation**: 30 minutes
- **Railway Deployment**: 30 minutes
- **Vercel Deployment**: 20 minutes
- **Integration**: 10 minutes
- **Third-Party Setup**: 20 minutes
- **Testing**: 30 minutes
- **Security**: 15 minutes
- **Monitoring**: 15 minutes
- **Go Live**: 5 minutes

**Total**: ~2.5 hours for complete production deployment

---

## ✅ Quick Start

```bash
# 1. Generate secrets
node generate-secrets.js

# 2. Deploy API
railway login
railway init
railway add --database postgres
railway up

# 3. Deploy Admin
cd apps/admin
vercel login
vercel --prod

# 4. Update CORS in Railway
railway variables set ADMIN_CORS_ORIGIN=<vercel-url>
railway up

# 5. Test everything!
```

---

**You're ready to deploy! Follow this checklist and you'll be live in production in 2-3 hours.** 🚀

*Last Updated: June 5, 2026*
