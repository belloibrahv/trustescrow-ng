# TrustEscrow NG Documentation

## Quick Links

### Getting Started
- **Main README**: `../README.md` - Development setup and architecture
- **Run Demo**: `npx tsx apps/api/interactive-demo.ts` - Interactive terminal demo

### Testing
- **System Test**: `cd apps/api && npx tsx test-system.ts` (7 component tests)
- **SMS Flow Test**: `cd apps/api && npx tsx test-sms-flow.ts` (5-step flow)
- **AI Test**: `cd apps/api && npx tsx test-multi-provider.ts`

### Key Commands
```bash
npm run dev              # Start API server
npm run db:studio        # Open Prisma Studio (DB viewer)
docker compose up -d     # Start PostgreSQL + Redis
npx tsx interactive-demo.ts  # Run full demo
```

### Configuration Guides (if needed)
- **SMS Setup**: Check Africa's Talking dashboard for API keys
- **AI Setup**: Set `AI_PROVIDER=groq` in `.env.development` (already configured)
- **Database**: Running on `localhost:54320` via Docker

### Production
- All APIs configured and tested
- 100% test pass rate
- Ready to launch beta

---

**Status**: ✅ Production Ready  
**Tests**: 12/12 Passing  
**AI**: Groq (Llama 3.3 70B) Active
