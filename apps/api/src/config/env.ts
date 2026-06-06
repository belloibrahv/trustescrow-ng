// apps/api/src/config/env.ts
// Validates all required environment variables at startup.
// The server will CRASH FAST with a clear error if any required var is missing.
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Security
  ADMIN_JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32-byte key as 64-char hex
  NIN_SALT: z.string().min(16),

  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),

  // Africa's Talking
  AT_USERNAME: z.string(),
  AT_API_KEY: z.string(),
  AT_SHORTCODE: z.string(),
  AT_SENDER_ID: z.string().optional(),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().startsWith('sk_'),
  PAYSTACK_PUBLIC_KEY: z.string().startsWith('pk_'),
  PAYSTACK_WEBHOOK_SECRET: z.string(),
  PAYSTACK_DVA_PROVIDER: z.string().default('wema-bank'),

  // Prembly
  PREMBLY_API_KEY: z.string(),
  PREMBLY_APP_ID: z.string(),
  PREMBLY_BASE_URL: z.string().url(),

  // ─── AI Provider Configuration ─────────────────────────────────────────────
  // Multi-provider support with automatic fallback
  AI_PROVIDER: z.enum([
    'github-models',  // GitHub Models (free tier, multiple models)
    'openai',         // Direct OpenAI
    'anthropic',      // Claude
    'gemini',         // Google Gemini
    'deepseek',       // DeepSeek (cost-effective)
    'groq',           // Groq (ultra-fast)
    'together',       // Together AI (open source)
    'fallback'        // Keyword matching (no API)
  ]).default('fallback'),
  
  AI_MODEL: z.string().optional(), // Specific model ID (e.g., 'gpt-4o-mini')
  
  // GitHub Models (Free tier access to multiple models)
  GITHUB_TOKEN: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // Anthropic Claude
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-6'),
  CLAUDE_MAX_TOKENS: z.coerce.number().default(1024),
  
  // Google Gemini
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-exp'),
  GEMINI_MAX_TOKENS: z.coerce.number().default(1024),
  
  // DeepSeek
  DEEPSEEK_API_KEY: z.string().optional(),
  
  // Groq
  GROQ_API_KEY: z.string().optional(),
  
  // Together AI
  TOGETHER_API_KEY: z.string().optional(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),

  // Feature flags
  USE_MOCK_NIN: z.coerce.boolean().default(false),
  USE_MOCK_PAYSTACK: z.coerce.boolean().default(false),
  LIVENESS_THRESHOLD_KOBO: z.coerce.number().default(50_000_000),
  DVA_EXPIRY_DAYS: z.coerce.number().default(7),
  DISPUTE_AUTO_ESCALATE_HOURS: z.coerce.number().default(48),
  MAX_NIN_ATTEMPTS: z.coerce.number().default(3),
  DEAL_VALUE_CAP_KOBO: z.coerce.number().default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
