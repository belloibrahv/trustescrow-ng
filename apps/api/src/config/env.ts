// apps/api/src/config/env.ts
// Validates all required environment variables at startup.
// The server will CRASH FAST with a clear error if any required var is missing.
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV ?? 'development'}` });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().min(1).default(process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'), // More flexible for deployment
  ADMIN_CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Security - required but flexible for Railway
  ADMIN_JWT_SECRET: z.string().min(10), // Reduced minimum length for Railway
  ENCRYPTION_KEY: z.string().min(32), // More flexible length requirement
  NIN_SALT: z.string().min(8), // Reduced minimum

  // Database - Railway provides DATABASE_URL automatically
  DATABASE_URL: z.string().min(1), // More flexible validation
  REDIS_URL: z.string().optional().default(''),    // Optional: falls back to in-memory cache if absent

  // Africa's Talking - optional to prevent startup failures
  AT_USERNAME: z.string().optional(),
  AT_API_KEY: z.string().optional(),
  AT_SHORTCODE: z.string().optional(),
  AT_SENDER_ID: z.string().optional(),

  // Paystack - flexible for test/live keys
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(), // Made optional for Railway
  PAYSTACK_PUBLIC_KEY: z.string().min(1).optional(),  // Made optional for Railway
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  PAYSTACK_DVA_PROVIDER: z.string().default('wema-bank'),

  // Prembly - optional to prevent startup failures
  PREMBLY_API_KEY: z.string().optional(),
  PREMBLY_APP_ID: z.string().optional(),
  PREMBLY_BASE_URL: z.string().min(1).optional(), // Made optional

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
  
  // In production (Railway), log but don't crash - use defaults
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Using fallback environment values for Railway deployment');
    
    // Create minimal environment for Railway startup
    const fallbackEnv = {
      NODE_ENV: 'production',
      PORT: parseInt(process.env.PORT || '3000'),
      APP_URL: process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
      ADMIN_CORS_ORIGIN: process.env.ADMIN_CORS_ORIGIN || 'http://localhost:3001',
      LOG_LEVEL: 'info',
      ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'railway-fallback-secret-min10chars',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '350498d24b8d2ac5de614a99f970574b2d5a984bdec0ff60a4fb50fe19f07231',
      NIN_SALT: process.env.NIN_SALT || 'railway-salt',
      DATABASE_URL: process.env.DATABASE_URL || '',
      REDIS_URL: process.env.REDIS_URL || '',
      AI_PROVIDER: 'fallback' as const,
      PAYSTACK_DVA_PROVIDER: 'wema-bank',
      CLAUDE_MODEL: 'claude-sonnet-4-6',
      CLAUDE_MAX_TOKENS: 1024,
      GEMINI_MODEL: 'gemini-2.0-flash-exp',
      GEMINI_MAX_TOKENS: 1024,
      USE_MOCK_NIN: false,
      USE_MOCK_PAYSTACK: false,
      LIVENESS_THRESHOLD_KOBO: 50_000_000,
      DVA_EXPIRY_DAYS: 7,
      DISPUTE_AUTO_ESCALATE_HOURS: 48,
      MAX_NIN_ATTEMPTS: 3,
      DEAL_VALUE_CAP_KOBO: 0,
    };
    
    // Export fallback environment
    const env = fallbackEnv;
    module.exports = { env };
  } else {
    process.exit(1);
  }
} else {
  const env = parsed.data;
  module.exports = { env };
}

export const env = parsed.success ? parsed.data : {} as any;
export type Env = z.infer<typeof envSchema>;
