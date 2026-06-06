// apps/api/src/services/ai-agent/providers.ts
// Multi-provider AI configuration supporting GitHub Models, OpenAI, Anthropic, Gemini, DeepSeek, etc.

export interface AIProviderConfig {
  name: string;
  endpoint?: string;
  requiresKey: boolean;
  supportsStreaming: boolean;
  maxTokens: number;
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPerMillionInputTokens?: number;
  costPerMillionOutputTokens?: number;
  supportsJSON: boolean;
  bestFor: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const AI_PROVIDERS: Record<string, AIProviderConfig> = {
  // GitHub Models - Free tier with multiple models
  'github-models': {
    name: 'GitHub Models',
    endpoint: 'https://models.inference.ai.azure.com',
    requiresKey: true, // GitHub PAT token
    supportsStreaming: true,
    maxTokens: 4096,
    rateLimits: {
      requestsPerMinute: 15, // Free tier limit
      tokensPerMinute: 150000,
    },
  },

  // OpenAI - Industry standard
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    requiresKey: true,
    supportsStreaming: true,
    maxTokens: 16384,
  },

  // Anthropic Claude
  anthropic: {
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    requiresKey: true,
    supportsStreaming: true,
    maxTokens: 8192,
  },

  // Google Gemini
  gemini: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    requiresKey: true,
    supportsStreaming: true,
    maxTokens: 8192,
  },

  // DeepSeek - OpenAI compatible, cost-effective
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    requiresKey: true,
    supportsStreaming: true,
    maxTokens: 8192,
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 500000,
    },
  },

  // Groq - Ultra-fast inference
  groq: {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    supportsStreaming: true,
    maxTokens: 8192,
    rateLimits: {
      requestsPerMinute: 30,
      tokensPerMinute: 300000,
    },
  },

  // Together AI - Open source models
  together: {
    name: 'Together AI',
    endpoint: 'https://api.together.xyz/v1',
    requiresKey: true,
    supportsStreaming: true,
    maxTokens: 8192,
  },

  // Fallback - No API required
  fallback: {
    name: 'Keyword Fallback',
    requiresKey: false,
    supportsStreaming: false,
    maxTokens: 0,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// MODEL CATALOG
// ═══════════════════════════════════════════════════════════════════════════

export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  // ─── GitHub Models (via Azure AI) ────────────────────────────────────────
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'github-models',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsJSON: true,
    bestFor: ['general', 'complex-reasoning', 'multimodal'],
  },

  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'github-models',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsJSON: true,
    bestFor: ['general', 'fast', 'cost-effective'],
  },

  'Llama-3.3-70B-Instruct': {
    id: 'meta-llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'github-models',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsJSON: true,
    bestFor: ['open-source', 'general', 'reasoning'],
  },

  'Phi-4': {
    id: 'phi-4',
    name: 'Phi-4',
    provider: 'github-models',
    contextWindow: 16000,
    maxOutputTokens: 4096,
    supportsJSON: true,
    bestFor: ['lightweight', 'fast', 'efficient'],
  },

  'DeepSeek-R1': {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1',
    provider: 'github-models',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsJSON: true,
    bestFor: ['reasoning', 'complex-tasks', 'cost-effective'],
  },

  'o1-mini': {
    id: 'o1-mini',
    name: 'OpenAI o1-mini',
    provider: 'github-models',
    contextWindow: 128000,
    maxOutputTokens: 65536,
    supportsJSON: false,
    bestFor: ['reasoning', 'math', 'coding'],
  },

  // ─── Direct OpenAI ───────────────────────────────────────────────────────
  'openai-gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o (Direct)',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    costPerMillionInputTokens: 2.50,
    costPerMillionOutputTokens: 10.00,
    supportsJSON: true,
    bestFor: ['general', 'production', 'reliable'],
  },

  'openai-gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Direct)',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    costPerMillionInputTokens: 0.15,
    costPerMillionOutputTokens: 0.60,
    supportsJSON: true,
    bestFor: ['cost-effective', 'high-volume', 'general'],
  },

  // ─── Anthropic ───────────────────────────────────────────────────────────
  'claude-sonnet-4': {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 3.00,
    costPerMillionOutputTokens: 15.00,
    supportsJSON: true,
    bestFor: ['complex-reasoning', 'long-context', 'analysis'],
  },

  'claude-3.5-sonnet': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 3.00,
    costPerMillionOutputTokens: 15.00,
    supportsJSON: true,
    bestFor: ['analysis', 'writing', 'coding'],
  },

  // ─── Google Gemini ───────────────────────────────────────────────────────
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 0.075,
    costPerMillionOutputTokens: 0.30,
    supportsJSON: true,
    bestFor: ['fast', 'multimodal', 'cost-effective'],
  },

  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 1.25,
    costPerMillionOutputTokens: 5.00,
    supportsJSON: true,
    bestFor: ['long-context', 'complex-tasks', 'multimodal'],
  },

  // ─── DeepSeek ────────────────────────────────────────────────────────────
  'deepseek-chat': {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 0.14,
    costPerMillionOutputTokens: 0.28,
    supportsJSON: true,
    bestFor: ['cost-effective', 'general', 'coding'],
  },

  'deepseek-reasoner': {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    provider: 'deepseek',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 0.55,
    costPerMillionOutputTokens: 2.19,
    supportsJSON: true,
    bestFor: ['reasoning', 'complex-tasks', 'problem-solving'],
  },

  // ─── Groq (Ultra-fast) ───────────────────────────────────────────────────
  'llama-3.3-70b-groq': {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 0.59,
    costPerMillionOutputTokens: 0.79,
    supportsJSON: true,
    bestFor: ['ultra-fast', 'real-time', 'low-latency'],
  },

  'mixtral-8x7b-groq': {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (Groq)',
    provider: 'groq',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    costPerMillionInputTokens: 0.24,
    costPerMillionOutputTokens: 0.24,
    supportsJSON: true,
    bestFor: ['fast', 'cost-effective', 'general'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get recommended models for a specific use case
 */
export function getRecommendedModels(useCase: string): ModelConfig[] {
  return Object.values(AVAILABLE_MODELS).filter((model) =>
    model.bestFor.includes(useCase)
  );
}

/**
 * Get the most cost-effective model for a use case
 */
export function getCheapestModel(useCase: string = 'general'): ModelConfig {
  const models = getRecommendedModels(useCase).filter(
    (m) => m.costPerMillionInputTokens !== undefined
  );

  return models.reduce((cheapest, current) => {
    const cheapestCost = (cheapest.costPerMillionInputTokens || 0) + 
                        (cheapest.costPerMillionOutputTokens || 0);
    const currentCost = (current.costPerMillionInputTokens || 0) + 
                       (current.costPerMillionOutputTokens || 0);
    return currentCost < cheapestCost ? current : cheapest;
  });
}

/**
 * Get the fastest model for a use case
 */
export function getFastestModel(useCase: string = 'general'): ModelConfig {
  const fastModels = getRecommendedModels('fast');
  const useCaseModels = getRecommendedModels(useCase);
  
  // Find models that are both fast and match the use case
  const intersection = fastModels.filter((fm) =>
    useCaseModels.some((um) => um.id === fm.id)
  );

  return intersection[0] || fastModels[0];
}

/**
 * Estimate cost for a request
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  const model = AVAILABLE_MODELS[modelId];
  if (!model?.costPerMillionInputTokens || !model?.costPerMillionOutputTokens) {
    return null;
  }

  const inputCost = (inputTokens / 1000000) * model.costPerMillionInputTokens;
  const outputCost = (outputTokens / 1000000) * model.costPerMillionOutputTokens;

  return inputCost + outputCost;
}
