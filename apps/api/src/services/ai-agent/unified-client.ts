// apps/api/src/services/ai-agent/unified-client.ts
// Unified AI client supporting multiple providers with automatic fallback

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { AI_PROVIDERS, AVAILABLE_MODELS, type ModelConfig } from './providers';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AIRequest {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  cost?: number;
  latencyMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED AI CLIENT
// ═══════════════════════════════════════════════════════════════════════════

export class UnifiedAIClient {
  private openaiClients: Map<string, OpenAI> = new Map();
  private anthropicClient?: Anthropic;
  private geminiClient?: GoogleGenerativeAI;
  private fallbackProviders: string[] = [];

  constructor() {
    this.initializeClients();
    this.setupFallbackChain();
  }

  /**
   * Initialize all available AI clients based on configuration
   */
  private initializeClients(): void {
    // GitHub Models (OpenAI-compatible)
    if (env.GITHUB_TOKEN) {
      this.openaiClients.set(
        'github-models',
        new OpenAI({
          apiKey: env.GITHUB_TOKEN,
          baseURL: AI_PROVIDERS['github-models'].endpoint,
        })
      );
      logger.info('✅ GitHub Models client initialized');
    }

    // Direct OpenAI
    if (env.OPENAI_API_KEY) {
      this.openaiClients.set(
        'openai',
        new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        })
      );
      logger.info('✅ OpenAI client initialized');
    }

    // Anthropic Claude
    if (env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY,
      });
      logger.info('✅ Anthropic client initialized');
    }

    // Google Gemini
    if (env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      logger.info('✅ Gemini client initialized');
    }

    // DeepSeek (OpenAI-compatible)
    if (env.DEEPSEEK_API_KEY) {
      this.openaiClients.set(
        'deepseek',
        new OpenAI({
          apiKey: env.DEEPSEEK_API_KEY,
          baseURL: AI_PROVIDERS.deepseek.endpoint,
        })
      );
      logger.info('✅ DeepSeek client initialized');
    }

    // Groq (OpenAI-compatible)
    if (env.GROQ_API_KEY) {
      this.openaiClients.set(
        'groq',
        new OpenAI({
          apiKey: env.GROQ_API_KEY,
          baseURL: AI_PROVIDERS.groq.endpoint,
        })
      );
      logger.info('✅ Groq client initialized');
    }

    // Together AI (OpenAI-compatible)
    if (env.TOGETHER_API_KEY) {
      this.openaiClients.set(
        'together',
        new OpenAI({
          apiKey: env.TOGETHER_API_KEY,
          baseURL: AI_PROVIDERS.together.endpoint,
        })
      );
      logger.info('✅ Together AI client initialized');
    }
  }

  /**
   * Setup fallback chain based on available providers
   */
  private setupFallbackChain(): void {
    // Priority order for fallback
    const preferredOrder = [
      'github-models', // Free tier, good models
      'deepseek',      // Cost-effective
      'groq',          // Ultra-fast
      'gemini',        // Large context
      'openai',        // Reliable
      'anthropic',     // High quality
      'together',      // Open source models
    ];

    this.fallbackProviders = preferredOrder.filter((provider) => {
      if (provider === 'anthropic') return !!this.anthropicClient;
      if (provider === 'gemini') return !!this.geminiClient;
      return this.openaiClients.has(provider);
    });

    if (this.fallbackProviders.length > 0) {
      logger.info(`Fallback chain: ${this.fallbackProviders.join(' → ')}`);
    } else {
      logger.warn('No AI providers configured - fallback mode only');
    }
  }

  /**
   * Make an AI request with automatic provider selection and fallback
   */
  async request(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Determine which provider/model to use
    const modelConfig = this.selectModel(request.model);
    
    if (!modelConfig) {
      throw new Error(`Model ${request.model} not found`);
    }

    // Try primary provider
    try {
      const response = await this.callProvider(modelConfig, request);
      response.latencyMs = Date.now() - startTime;
      return response;
    } catch (primaryError) {
      logger.warn({ err: primaryError, model: modelConfig.id }, 'Primary AI provider failed');

      // Try fallback providers
      for (const fallbackProvider of this.fallbackProviders) {
        if (fallbackProvider === modelConfig.provider) continue; // Skip the one that failed

        try {
          // Find a suitable model from this provider
          const fallbackModel = Object.values(AVAILABLE_MODELS).find(
            (m) => m.provider === fallbackProvider
          );

          if (!fallbackModel) continue;

          logger.info(`Trying fallback provider: ${fallbackProvider}`);
          const response = await this.callProvider(fallbackModel, request);
          response.latencyMs = Date.now() - startTime;
          return response;
        } catch (fallbackError) {
          logger.warn({ err: fallbackError, provider: fallbackProvider }, 'Fallback provider failed');
          continue;
        }
      }

      // All providers failed
      throw new Error('All AI providers failed');
    }
  }

  /**
   * Select the best model based on request or configuration
   */
  private selectModel(requestedModel?: string): ModelConfig | null {
    // If specific model requested, use it
    if (requestedModel && AVAILABLE_MODELS[requestedModel]) {
      return AVAILABLE_MODELS[requestedModel];
    }

    // Use configured default model
    if (env.AI_MODEL && AVAILABLE_MODELS[env.AI_MODEL]) {
      return AVAILABLE_MODELS[env.AI_MODEL];
    }

    // Auto-select based on available providers
    for (const provider of this.fallbackProviders) {
      const model = Object.values(AVAILABLE_MODELS).find(
        (m) => m.provider === provider
      );
      if (model) return model;
    }

    return null;
  }

  /**
   * Call a specific provider
   */
  private async callProvider(
    model: ModelConfig,
    request: AIRequest
  ): Promise<AIResponse> {
    logger.debug({ model: model.id, provider: model.provider }, 'Calling AI provider');

    switch (model.provider) {
      case 'anthropic':
        return this.callAnthropic(model, request);
      
      case 'gemini':
        return this.callGemini(model, request);
      
      // All OpenAI-compatible providers
      case 'github-models':
      case 'openai':
      case 'deepseek':
      case 'groq':
      case 'together':
        return this.callOpenAICompatible(model, request);
      
      default:
        throw new Error(`Unsupported provider: ${model.provider}`);
    }
  }

  /**
   * Call OpenAI-compatible API
   */
  private async callOpenAICompatible(
    model: ModelConfig,
    request: AIRequest
  ): Promise<AIResponse> {
    const client = this.openaiClients.get(model.provider);
    if (!client) {
      throw new Error(`No client for provider: ${model.provider}`);
    }

    const completion = await client.chat.completions.create({
      model: model.id,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userMessage },
      ],
      max_tokens: request.maxTokens || model.maxOutputTokens,
      temperature: request.temperature ?? 0.7,
      response_format: request.jsonMode && model.supportsJSON 
        ? { type: 'json_object' } 
        : undefined,
    });

    const content = completion.choices[0]?.message?.content || '';
    const usage = completion.usage;

    return {
      content,
      model: model.id,
      provider: model.provider,
      tokensUsed: usage ? {
        input: usage.prompt_tokens,
        output: usage.completion_tokens,
        total: usage.total_tokens,
      } : undefined,
      latencyMs: 0, // Will be set by caller
    };
  }

  /**
   * Call Anthropic Claude API
   */
  private async callAnthropic(
    model: ModelConfig,
    request: AIRequest
  ): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const response = await this.anthropicClient.messages.create({
      model: model.id,
      max_tokens: request.maxTokens || model.maxOutputTokens,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userMessage }],
      temperature: request.temperature,
    });

    const content = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return {
      content,
      model: model.id,
      provider: model.provider,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      latencyMs: 0,
    };
  }

  /**
   * Call Google Gemini API
   */
  private async callGemini(
    model: ModelConfig,
    request: AIRequest
  ): Promise<AIResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const geminiModel = this.geminiClient.getGenerativeModel({
      model: model.id,
      generationConfig: {
        maxOutputTokens: request.maxTokens || model.maxOutputTokens,
        temperature: request.temperature ?? 0.7,
      },
    });

    const prompt = `${request.systemPrompt}\n\n${request.userMessage}`;
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    let content = response.text();

    // Clean markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return {
      content,
      model: model.id,
      provider: model.provider,
      tokensUsed: response.usageMetadata ? {
        input: response.usageMetadata.promptTokenCount || 0,
        output: response.usageMetadata.candidatesTokenCount || 0,
        total: response.usageMetadata.totalTokenCount || 0,
      } : undefined,
      latencyMs: 0,
    };
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return this.fallbackProviders;
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: string): boolean {
    return this.fallbackProviders.includes(provider);
  }
}

// Export singleton instance
export const aiClient = new UnifiedAIClient();
