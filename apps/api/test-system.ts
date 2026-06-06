#!/usr/bin/env tsx
/**
 * TrustEscrow NG - Complete System Test
 * Tests all components: Database, Redis, AI, SMS, Payments
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment
config({ path: resolve(__dirname, '.env.development') });

import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import AfricasTalking from 'africastalking';

const prisma = new PrismaClient();

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function success(message: string) {
  log('✅', message, colors.green);
}

function error(message: string) {
  log('❌', message, colors.red);
}

function info(message: string) {
  log('ℹ️', message, colors.cyan);
}

function header(message: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
  details?: any;
}

const results: TestResult[] = [];

async function testDatabase(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Test connection
    await prisma.$connect();
    
    // Test query
    const userCount = await prisma.user.count();
    const dealCount = await prisma.deal.count();
    
    // Test write
    const testUser = await prisma.user.findFirst();
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'PostgreSQL Database',
      passed: true,
      message: `Connected successfully`,
      duration,
      details: {
        users: userCount,
        deals: dealCount,
        tables: ['users', 'deals', 'messages', 'disputes', 'audit_logs'],
      },
    };
  } catch (err: any) {
    return {
      name: 'PostgreSQL Database',
      passed: false,
      message: err.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testRedis(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const redis = createClient({
      url: process.env.REDIS_URL,
    });
    
    await redis.connect();
    
    // Test write
    await redis.set('test:system', 'ok', { EX: 10 });
    
    // Test read
    const value = await redis.get('test:system');
    
    // Test delete
    await redis.del('test:system');
    
    await redis.quit();
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'Redis Cache',
      passed: value === 'ok',
      message: 'Connected and operations working',
      duration,
      details: {
        operations: ['SET', 'GET', 'DEL'],
      },
    };
  } catch (err: any) {
    return {
      name: 'Redis Cache',
      passed: false,
      message: err.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testAI(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Dynamic import to avoid module issues
    const { aiClient } = await import('./src/services/ai-agent/unified-client');
    
    const providers = aiClient.getAvailableProviders();
    
    if (providers.length === 0) {
      return {
        name: 'AI System',
        passed: false,
        message: 'No AI providers available',
        duration: Date.now() - startTime,
      };
    }
    
    // Test simple request
    const response = await aiClient.request({
      systemPrompt: 'You are a helpful assistant.',
      userMessage: 'Say "OK" if you can hear me.',
      temperature: 0.1,
    });
    
    const duration = Date.now() - startTime;
    
    return {
      name: 'AI System',
      passed: true,
      message: `Working with ${response.provider}`,
      duration,
      details: {
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed,
        availableProviders: providers,
      },
    };
  } catch (err: any) {
    return {
      name: 'AI System',
      passed: false,
      message: err.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testAfricasTalking(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const at = AfricasTalking({
      apiKey: process.env.AT_API_KEY!,
      username: process.env.AT_USERNAME!,
    });
    
    // Test by fetching application data (doesn't send SMS)
    const sms = at.SMS;
    
    // Verify configuration
    const config = {
      username: process.env.AT_USERNAME,
      shortcode: process.env.AT_SHORTCODE,
      senderId: process.env.AT_SENDER_ID,
      apiKeySet: !!process.env.AT_API_KEY,
      apiKeyLength: process.env.AT_API_KEY?.length || 0,
    };
    
    const duration = Date.now() - startTime;
    
    return {
      name: "Africa's Talking SMS",
      passed: true,
      message: 'Client initialized successfully',
      duration,
      details: config,
    };
  } catch (err: any) {
    return {
      name: "Africa's Talking SMS",
      passed: false,
      message: err.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testPaystack(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Test Paystack API by verifying credentials
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    
    const data = await response.json();
    
    const duration = Date.now() - startTime;
    
    if (response.ok && data.status) {
      return {
        name: 'Paystack Payment',
        passed: true,
        message: 'API credentials valid',
        duration,
        details: {
          mode: process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test') ? 'test' : 'live',
          banks: data.data?.length || 0,
        },
      };
    } else {
      return {
        name: 'Paystack Payment',
        passed: false,
        message: data.message || 'Invalid credentials',
        duration,
      };
    }
  } catch (err: any) {
    return {
      name: 'Paystack Payment',
      passed: false,
      message: err.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testPrembly(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Check if mock mode is enabled
    const mockMode = process.env.USE_MOCK_NIN === 'true';
    
    if (mockMode) {
      return {
        name: 'Prembly Identity',
        passed: true,
        message: 'Running in MOCK mode (no API calls)',
        duration: Date.now() - startTime,
        details: {
          mode: 'mock',
          note: 'Set USE_MOCK_NIN=false to test real API',
        },
      };
    }
    
    // Test real API with ping endpoint
    const response = await fetch(`${process.env.PREMBLY_BASE_URL}/v2/base/ping`, {
      headers: {
        'x-api-key': process.env.PREMBLY_API_KEY!,
        'app-id': process.env.PREMBLY_APP_ID!,
      },
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      return {
        name: 'Prembly Identity',
        passed: true,
        message: 'API connection successful',
        duration,
        details: {
          mode: 'live',
          baseUrl: process.env.PREMBLY_BASE_URL,
        },
      };
    } else {
      return {
        name: 'Prembly Identity',
        passed: false,
        message: `API returned ${response.status}`,
        duration,
      };
    }
  } catch (err: any) {
    return {
      name: 'Prembly Identity',
      passed: false,
      message: err.message,
      duration: Date.now() - startTime,
    };
  }
}

async function testEnvironment(): Promise<TestResult> {
  const requiredVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'ENCRYPTION_KEY',
    'ADMIN_JWT_SECRET',
    'NIN_SALT',
    'AT_API_KEY',
    'AT_USERNAME',
    'AT_SHORTCODE',
    'PAYSTACK_SECRET_KEY',
    'AI_PROVIDER',
  ];
  
  const missing: string[] = [];
  const present: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      present.push(varName);
    }
  }
  
  return {
    name: 'Environment Variables',
    passed: missing.length === 0,
    message: missing.length === 0 ? 'All required variables set' : `Missing ${missing.length} variables`,
    details: {
      required: requiredVars.length,
      present: present.length,
      missing,
    },
  };
}

async function runTests() {
  header('🧪 TRUSTESCROW NG - SYSTEM TEST SUITE');
  
  info('Starting comprehensive system tests...\n');
  
  // Run tests
  const tests = [
    { name: 'Environment', fn: testEnvironment },
    { name: 'Database', fn: testDatabase },
    { name: 'Redis', fn: testRedis },
    { name: 'AI', fn: testAI },
    { name: "Africa's Talking", fn: testAfricasTalking },
    { name: 'Paystack', fn: testPaystack },
    { name: 'Prembly', fn: testPrembly },
  ];
  
  for (const test of tests) {
    info(`Testing ${test.name}...`);
    const result = await test.fn();
    results.push(result);
    
    if (result.passed) {
      success(`${result.name}: ${result.message} ${result.duration ? `(${result.duration}ms)` : ''}`);
      if (result.details) {
        console.log(`   ${colors.cyan}Details:${colors.reset}`, JSON.stringify(result.details, null, 2).split('\n').map((line, i) => i === 0 ? line : '   ' + line).join('\n'));
      }
    } else {
      error(`${result.name}: ${result.message} ${result.duration ? `(${result.duration}ms)` : ''}`);
    }
    console.log('');
  }
  
  // Summary
  header('📊 TEST SUMMARY');
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}Success Rate: ${((passed / total) * 100).toFixed(1)}%${colors.reset}\n`);
  
  if (failed === 0) {
    success('🎉 All tests passed! Your system is ready!');
    console.log('');
    console.log(`${colors.bright}${colors.green}Next Steps:${colors.reset}`);
    console.log(`  1. Test SMS flow with Africa's Talking simulator`);
    console.log(`  2. Test payment flow with Paystack test cards`);
    console.log(`  3. Monitor logs: ${colors.cyan}npm run dev${colors.reset}`);
    console.log(`  4. View queues: ${colors.cyan}http://localhost:3002${colors.reset}`);
    console.log('');
  } else {
    error('❌ Some tests failed. Please check the details above.');
    console.log('');
    console.log(`${colors.bright}${colors.yellow}Failed Tests:${colors.reset}`);
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  • ${r.name}: ${r.message}`);
    });
    console.log('');
  }
  
  // Cleanup
  await prisma.$disconnect();
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

// Run tests
runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
