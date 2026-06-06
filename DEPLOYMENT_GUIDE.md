# TrustEscrow NG — Production Deployment Guide

**Target:** Railway (API + Database) + Vercel (Admin Dashboard)

---

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing: `npm test`
- [ ] Type checking clean: `npm run typecheck`
- [ ] Linting clean: `npm run lint`
- [ ] No console.log in production code
- [ ] Environment variables documented

### 2. Security
- [ ] All API keys rotated to production keys
- [ ] JWT secret is strong (256-bit)
- [ ] Encryption key is strong (32 bytes)
- [ ] NIN salt is unique and random
- [ ] CORS configured for admin domain only
- [ ] Rate limiting enabled
- [ ] HTTPS enforced (Railway handles this)

### 3. Database
- [ ] Migrations tested locally
- [ ] Seed data removed (or production-safe)
- [ ] Backup strategy defined
- [ ] Indexes optimized

### 4. Third-Party Services
- [ ] Africa's Talking: Live credentials
- [ ] Paystack: Live secret keys
- [ ] Prembly: Live API key
- [ ] AI Provider: Production API key
- [ ] Sentry: DSN configured
- [ ] Shortcode approved by NCC (2-4 weeks lead time)

---

## Step 1: Database Setup (Railway PostgreSQL)

### 1.1 Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init
```

### 1.2 Add PostgreSQL Database

1. Go to Railway dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Note the connection string

### 1.3 Add Redis

1. Click "New" → "Database" → "Redis"
2. Note the connection string

### 1.4 Run Migrations

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgresql://..."

# Run migrations
npm run db:migrate --workspace=apps/api

# Verify
railway run npm run db:studio --workspace=apps/api
```

---

## Step 2: API Deployment (Railway)

### 2.1 Configure Environment Variables

In Railway dashboard, add these variables:

```bash
# Server
NODE_ENV=production
PORT=3000
APP_URL=https://api.trustescrow.ng

# Security
ADMIN_JWT_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>
NIN_SALT=<generate-with-openssl-rand-hex-32>

# Database (Auto-filled by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Africa's Talking
AT_USERNAME=TrustEscrowNG
AT_API_KEY=atsk_xxxxxxxxxxxxxxxxxxxxxxxxx
AT_SHORTCODE=33200
AT_SENDER_ID=TRUSTESCROW

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=<from-paystack-dashboard>
PAYSTACK_DVA_PROVIDER=wema-bank

# Prembly
PREMBLY_API_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxxx
PREMBLY_APP_ID=live_xxxxxxxx
PREMBLY_BASE_URL=https://api.prembly.com

# AI Provider (choose one)
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL=llama-3.3-70b-versatile

# Twilio (Fallback)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+234XXXXXXXXXX

# Feature Flags
USE_MOCK_NIN=false
USE_MOCK_PAYSTACK=false
LIVENESS_THRESHOLD=500000
DVA_EXPIRY_DAYS=7
DISPUTE_AUTO_ESCALATE_HOURS=48
MAX_NIN_ATTEMPTS=3

# Monitoring
SENTRY_DSN=https://xxxxxxxxx@sentry.io/xxxxxxx
```

### 2.2 Deploy API

```bash
# From project root
cd apps/api

# Deploy to Railway
railway up

# Or connect to GitHub for auto-deploy
railway link
```

### 2.3 Verify Deployment

```bash
# Check health endpoint
curl https://api.trustescrow.ng/health

# Expected response:
# {"status":"ok","time":"2026-06-04T..."}
```

---

## Step 3: Configure Webhooks

### 3.1 Paystack Webhook

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://api.trustescrow.ng/api/webhooks/paystack`
3. Copy webhook secret to `PAYSTACK_WEBHOOK_SECRET`
4. Test with sample charge.success event

### 3.2 Africa's Talking Callback

1. Go to AT Dashboard → SMS → Callback URLs
2. Set delivery reports URL: `https://api.trustescrow.ng/api/sms/delivery`
3. Set incoming messages URL: `https://api.trustescrow.ng/api/sms/inbound`
4. Test with sandbox first

---

## Step 4: Admin Dashboard Deployment (Vercel)

### 4.1 Configure Environment

Create `apps/admin/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://api.trustescrow.ng
```

### 4.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from admin folder
cd apps/admin
vercel --prod

# Or connect to GitHub
vercel link
```

### 4.3 Configure Domain

1. Go to Vercel dashboard
2. Add custom domain: `admin.trustescrow.ng`
3. Update DNS records as instructed

### 4.4 Update API CORS

Add admin domain to API CORS whitelist:

```typescript
// apps/api/src/index.ts
await app.register(cors, {
  origin: [
    'https://admin.trustescrow.ng',
    process.env.NODE_ENV === 'development' && 'http://localhost:3001',
  ].filter(Boolean),
  credentials: true,
});
```

---

## Step 5: DNS Configuration

### API Domain (api.trustescrow.ng)

Add these records to your DNS:

```
Type: CNAME
Name: api
Value: <railway-domain>.up.railway.app
TTL: 3600
```

### Admin Domain (admin.trustescrow.ng)

Vercel will provide specific DNS records. Typically:

```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 3600
```

---

## Step 6: Monitoring Setup

### 6.1 Sentry (Error Tracking)

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Login
sentry-cli login

# Create project
sentry-cli projects create trustescrow-ng-api

# Get DSN from dashboard
# Add to Railway environment variables
```

### 6.2 Uptime Monitoring

Set up health check monitoring:

1. **UptimeRobot** (free): https://uptimerobot.com
   - Monitor: `https://api.trustescrow.ng/health`
   - Check interval: 5 minutes
   - Alert via email/SMS if down

2. **Better Uptime**: https://betteruptime.com
   - More advanced monitoring
   - Status page included

---

## Step 7: Production Testing

### 7.1 Smoke Tests

```bash
# 1. Health check
curl https://api.trustescrow.ng/health

# 2. Admin dashboard
open https://admin.trustescrow.ng

# 3. Test SMS (from phone)
# Send "START" to shortcode 33200
```

### 7.2 End-to-End Test

1. Create test deal via SMS
2. Complete verification (use real NIN/BVN or test accounts)
3. Make test payment (Paystack test mode if still testing)
4. Monitor in admin dashboard
5. Complete deal flow

### 7.3 Load Test

```bash
# Install k6
brew install k6

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,
  duration: '60s',
};

export default function() {
  let res = http.get('https://api.trustescrow.ng/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
EOF

# Run test
k6 run load-test.js
```

---

## Step 8: Go-Live Checklist

### Pre-Launch (1 day before)

- [ ] All production credentials configured
- [ ] Database backed up
- [ ] Monitoring dashboards ready
- [ ] Team trained on admin dashboard
- [ ] Support phone number ready
- [ ] Incident response plan documented
- [ ] Rollback plan ready

### Launch Day

- [ ] Switch DNS to production
- [ ] Monitor error logs (Sentry)
- [ ] Watch health metrics
- [ ] Test first real deal manually
- [ ] Have team on standby

### Post-Launch (24h monitoring)

- [ ] Check error rates (should be < 0.1%)
- [ ] Monitor response times (API should be < 500ms)
- [ ] Watch for SMS delivery issues
- [ ] Verify webhooks are being received
- [ ] Check database performance

---

## Rollback Procedure

If critical issues occur:

### API Rollback

```bash
# Railway: Revert to previous deployment
railway rollback

# Or redeploy previous commit
git checkout <previous-commit>
railway up
```

### Database Rollback

```bash
# Restore from backup
railway db:restore <backup-id>

# Or run reverse migrations
npm run db:migrate:rollback --workspace=apps/api
```

### Admin Dashboard Rollback

```bash
# Vercel: Revert to previous deployment
vercel rollback <deployment-url>
```

---

## Maintenance

### Daily
- Check error logs in Sentry
- Review new disputes in admin dashboard
- Monitor SMS delivery rates

### Weekly
- Database backup verification
- Review performance metrics
- Update dependencies (security patches)

### Monthly
- Full system health check
- Load testing
- Security audit
- Update documentation

---

## Troubleshooting

### API Not Responding

1. Check Railway logs: `railway logs`
2. Verify environment variables
3. Check database connection
4. Review recent deployments

### SMS Not Sending

1. Check Africa's Talking dashboard for errors
2. Verify AT_API_KEY is live key (not sandbox)
3. Check shortcode status with NCC
4. Review SMS queue in BullMQ dashboard

### Webhook Not Triggering

1. Check Paystack webhook logs
2. Verify HMAC signature validation
3. Test webhook with Paystack's test event feature
4. Check API logs for incoming webhook requests

### Database Connection Issues

1. Check Railway PostgreSQL status
2. Verify DATABASE_URL format
3. Check connection pool limits
4. Review Prisma client configuration

---

## Emergency Contacts

**Railway Support:** support@railway.app  
**Vercel Support:** support@vercel.com  
**Africa's Talking:** support@africastalking.com  
**Paystack Support:** support@paystack.com  
**Prembly Support:** support@prembly.com

---

## Post-Deployment Optimization

### Performance
- [ ] Enable Railway Pro plan for better performance
- [ ] Configure Redis caching for frequent queries
- [ ] Add CDN for admin dashboard static assets
- [ ] Optimize database indexes

### Security
- [ ] Enable Railway's DDoS protection
- [ ] Set up Web Application Firewall (WAF)
- [ ] Regular security audits
- [ ] Penetration testing

### Scaling
- [ ] Monitor concurrent users
- [ ] Plan for horizontal scaling (multiple API instances)
- [ ] Consider read replicas for database
- [ ] Implement queue-based processing for heavy loads

---

**Last Updated:** June 4, 2026  
**Maintained By:** Development Team
