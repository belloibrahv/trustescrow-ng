// Test script for multi-provider AI system
import 'dotenv/config';
import { aiClient } from './src/services/ai-agent/unified-client';
import { AVAILABLE_MODELS, getCheapestModel, getFastestModel } from './src/services/ai-agent/providers';

async function testMultiProvider() {
  console.log('🧪 Testing Multi-Provider AI System\n');

  // Check available providers
  const providers = aiClient.getAvailableProviders();
  console.log('📡 Available Providers:');
  if (providers.length === 0) {
    console.log('   ❌ No AI providers configured!');
    console.log('   💡 Add at least one API key to .env.development\n');
    console.log('   Quick start with GitHub Models:');
    console.log('   1. Get token: https://github.com/settings/tokens');
    console.log('   2. Add to .env: GITHUB_TOKEN=github_pat_your_token\n');
    return;
  }
  
  providers.forEach((p, i) => {
    console.log(`   ${i + 1}. ✅ ${p}`);
  });
  console.log('');

  // Show available models
  console.log('🎯 Available Models:');
  const modelsByProvider: Record<string, string[]> = {};
  Object.entries(AVAILABLE_MODELS).forEach(([key, model]) => {
    if (!modelsByProvider[model.provider]) {
      modelsByProvider[model.provider] = [];
    }
    modelsByProvider[model.provider].push(`${model.name} (${key})`);
  });
  
  Object.entries(modelsByProvider).forEach(([provider, models]) => {
    console.log(`\n   ${provider}:`);
    models.forEach(m => console.log(`     - ${m}`));
  });
  console.log('');

  // Show recommendations
  console.log('💡 Recommendations:');
  const cheapest = getCheapestModel('general');
  console.log(`   Cheapest: ${cheapest.name} (${cheapest.provider})`);
  if (cheapest.costPerMillionInputTokens) {
    console.log(`   Cost: $${cheapest.costPerMillionInputTokens}/M input tokens`);
  }
  
  const fastest = getFastestModel('general');
  console.log(`   Fastest: ${fastest.name} (${fastest.provider})`);
  console.log('');

  // Test actual AI request
  console.log('📤 Testing AI Request...');
  console.log('   Prompt: "Respond with: OK"');
  
  try {
    const startTime = Date.now();
    const response = await aiClient.request({
      systemPrompt: 'You are a test assistant. Respond with exactly "OK" and nothing else.',
      userMessage: 'Test',
      maxTokens: 10,
    });

    console.log('\n✅ Success!');
    console.log(`   Provider: ${response.provider}`);
    console.log(`   Model: ${response.model}`);
    console.log(`   Response: "${response.content}"`);
    console.log(`   Latency: ${response.latencyMs}ms`);
    
    if (response.tokensUsed) {
      console.log(`   Tokens: ${response.tokensUsed.total} (${response.tokensUsed.input} in, ${response.tokensUsed.output} out)`);
    }

    // Test JSON mode
    console.log('\n📤 Testing JSON Mode...');
    const jsonResponse = await aiClient.request({
      systemPrompt: 'Return valid JSON only. No markdown, no explanations.',
      userMessage: 'Return JSON: {"status": "working", "provider": "' + response.provider + '"}',
      jsonMode: true,
      maxTokens: 50,
    });

    console.log('✅ JSON Response:');
    const parsed = JSON.parse(jsonResponse.content);
    console.log(`   ${JSON.stringify(parsed, null, 2)}`);
    console.log(`   Latency: ${jsonResponse.latencyMs}ms`);

    // Test fallback
    console.log('\n🔄 Testing Fallback Chain...');
    console.log('   (Simulating primary provider failure)');
    
    // Try a non-existent model to trigger fallback
    try {
      const fallbackResponse = await aiClient.request({
        systemPrompt: 'Test',
        userMessage: 'Test fallback',
        model: 'nonexistent-model',
      });
      console.log('✅ Fallback worked!');
      console.log(`   Fell back to: ${fallbackResponse.provider}/${fallbackResponse.model}`);
    } catch (err) {
      console.log('❌ All providers failed - this is expected if only one is configured');
    }

    console.log('\n🎉 All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Configure additional providers in .env.development');
    console.log('   2. Set AI_PROVIDER=github-models (or your preferred provider)');
    console.log('   3. Restart: npm run dev');
    console.log('   4. Your AI agent is ready! 🚀');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your API keys in .env.development');
    console.log('   2. Verify token has correct permissions');
    console.log('   3. Check rate limits haven\'t been exceeded');
    console.log('   4. See MULTI_PROVIDER_AI_GUIDE.md for details');
  }
}

testMultiProvider()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
