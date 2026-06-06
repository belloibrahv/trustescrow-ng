# TrustEscrow NG — Developer README

> SMS-first agentic escrow platform for Nigerian peer-to-peer commerce.  
> **NEW:** Multi-provider AI system with 7+ providers and automatic fallback

---

## ⚡ Quick Start (Local Dev — 10 minutes)

### Prerequisites
- Node.js 20 LTS (`node -v`)
- Docker Desktop (for local PostgreSQL + Redis)
- ngrok or Cloudflare Tunnel (for AT webhook testing)

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-org/trustescrow-ng.git
cd trustescrow-ng

# Run the startup script
./start-dev.sh
```

This will:
✅ Install dependencies  
✅ Start PostgreSQL + Redis  
✅ Run database migrations  
✅ Start API server (port 3000)  
✅ Start admin dashboard (port 3001)

### Option 2: Manual Setup

```bash
# 1. Clone & install
git clone https://github.com/your-org/trustescrow-ng.git
cd trustescrow-ng
npm ci

# 2. Start local infrastructure
docker compose up -d
# PostgreSQL on :54320 (changed from 5432), Redis on :6379, Bull Board on :3002

# 3. Configure environment
cp apps/api/.env.example apps/api/.env.development
# Fill in your sandbox API keys — see Section 9 of the Blueprint doc

# 4. Run DB migrations and seed
npm run db:migrate
npm run db:seed

# 5. Start the API server
npm run dev
# API on http://localhost:3000
# Health: http://localhost:3000/health
# Bull Board: http://localhost:3002

# 6. Start admin dashboard (separate terminal)
npm run dev:admin
# Admin on http://localhost:3001

# 7. Expose webhook for Africa's Talking (dev)
npx ngrok http 3000
# Copy https URL, set as AT webhook: https://xxxx.ngrok.io/api/sms/inbound

# 8. Run tests
npm test

# 9. Try the interactive demo
cd apps/api
npx tsx interactive-demo.ts
# Walk through a complete buyer-seller workflow interactively!
```

---

## Project Structure

```
trustescrow-ng/
├── apps/
│   ├── api/           ← Fastify API server (main backend)
│   └── admin/         ← Next.js 14 admin dashboard  
├── packages/types/     ← Shared TypeScript types
├── docker-compose.yml  ← Local dev infrastructure
└── .github/workflows/  ← CI/CD pipelines
```

---

## Key Commands

| Command | Description |
|---|---|
| `npm run dev` | Start API in watch mode |
| `npm test` | Run all tests |
| `npm run typecheck` | TypeScript type-check without build |
| `npm run db:migrate` | Apply pending Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (visual DB explorer) |
| `npm run db:seed` | Seed local DB with test data |
| `docker-compose up -d` | Start PostgreSQL + Redis |
| `docker-compose down -v` | Stop and wipe local data |

---

## Test Credentials (Sandbox)

| Service | NIN | BVN | Phone |
|---|---|---|---|
| Buyer | 12345678901 | 1234567890 | +2348012345678 |
| Seller | 98765432109 | 9876543210 | +2348098765432 |

**Sandbox SMS**: Use Africa's Talking Simulator at https://simulator.africastalking.com

**Paystack test cards**: https://paystack.com/docs/payments/test-payments/

---

## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/sms/inbound` | Africa's Talking webhook |
| GET | `/api/sms/health` | SMS queue health check |
| POST | `/api/webhooks/paystack` | Paystack event webhook |
| GET | `/api/admin/deals` | List all deals (JWT required) |
| GET | `/api/admin/deals/:id` | Deal detail + audit log |
| POST | `/api/admin/disputes/:id/resolve` | Resolve a dispute |
| GET | `/api/admin/users/:phone` | User KYC lookup |
| GET | `/api/admin/metrics` | Dashboard statistics |
| GET | `/health` | Server health check |

---

## Deal State Machine

```
START_DEAL
    │
    ▼
INITIATED ──(consent)──▶ BUYER_VERIFIED ──(seller NIN+BVN)──▶ BOTH_VERIFIED
                                                                      │
                                                               TERMS_AGREED
                                                                      │
                                                           PAYMENT_PENDING ──(DVA expires)──▶ REFUNDED
                                                                      │
                                                                 FUNDS_HELD
                                                                      │
                                                        AWAITING_CONFIRMATION
                                                               │          │
                                                        RECEIVED       DISPUTE
                                                           │              │
                                                       COMPLETED    DISPUTE_OPEN
                                                                         │
                                                                   MEDIATION (48h)
                                                                    │        │
                                                               COMPLETED  ESCALATED
                                                                             │
                                                                    Human mediator
```

---

## Environment Variables

See `apps/api/.env.example` for the full list with comments.

**Dev mode flags:**
- `USE_MOCK_NIN=true` — bypass Prembly calls, use local mock data
- `USE_MOCK_PAYSTACK=false` — use real Paystack test keys

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| HTTP framework | Fastify | 2× Express throughput, built-in schema validation |
| Job queue | BullMQ + Redis | AT requires 5s response; processing must be async |
| ORM | Prisma | Type-safe queries + auto-migrations |
| **AI (NEW)** | **Multi-provider** | **7+ providers, auto-fallback, cost optimization** |
| Identity | Prembly Identitypass | BVN+NIN mashup in single call, NIMC-approved |
| Payments | Paystack DVA | Regulated escrow account per deal, NDIC-insured |
| SMS Primary | Africa's Talking | Lowest cost Nigerian provider, sandbox simulator |
| SMS Fallback | Twilio | Reliability; AT outages rare but deal-breaking |

### 🆕 AI Provider Support

Choose from 7 providers with automatic fallback:
- **GitHub Models** (Free) - GPT-4o, Llama 3.3, Phi-4, DeepSeek-R1
- **DeepSeek** ($0.14/M) - Cost-effective reasoning
- **Groq** (Fast) - 70+ tokens/sec
- **OpenAI** (Reliable) - GPT-4o, GPT-4o-mini
- **Gemini** (Long context) - 2M token window
- **Claude** (Quality) - Best reasoning
- **Fallback** (Free) - Keyword matching

**Quick setup (free):**
```bash
# Get token: https://github.com/settings/tokens (scope: read:packages)
echo 'AI_PROVIDER=github-models' >> apps/api/.env.development
echo 'GITHUB_TOKEN=github_pat_your_token' >> apps/api/.env.development
echo 'AI_MODEL=gpt-4o-mini' >> apps/api/.env.development
```

**See:** `MULTI_PROVIDER_AI_GUIDE.md` for full details

---

## Security Notes

- **NIN never stored raw** — HMAC-SHA256 hash only
- **Bank accounts encrypted** — AES-256-GCM at application layer  
- **Webhook HMAC** — All Paystack webhooks validated before processing
- **Distributed lock** — Redis SETNX prevents concurrent state transitions per user
- **Rate limiting** — 30 req/min global; 3 NIN attempts per phone per 24h
- **NDPR compliance** — Explicit SMS consent required before any identity collection

---

## Interactive Demo

Experience the complete buyer-seller workflow:

```bash
cd apps/api
npx tsx interactive-demo.ts
```

**What it does:**
- Simulates a real deal end-to-end
- Uses actual APIs (SMS, AI, Payment, Identity)
- Interactive terminal interface
- Shows timing, costs, and revenue
- Perfect for presentations or testing

**Demo Flow:** START → Deal Description → Verification → Payment → Shipping → Delivery → Complete

---

## Contributing

1. Branch from `develop` — never push directly to `main`
2. PR title format: `[type]: description` (feat/fix/chore/docs)
3. All CI checks must pass before merge
4. Every new service function needs a corresponding test
