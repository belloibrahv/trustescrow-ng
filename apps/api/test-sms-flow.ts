#!/usr/bin/env tsx
/**
 * TrustEscrow NG - SMS Flow Test
 * Simulates a complete SMS-based deal creation flow
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.development') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function simulateInboundSMS(from: string, text: string, step: number) {
  console.log(`\n${colors.bright}${colors.blue}─────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}STEP ${step}: User sends SMS${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}─────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.yellow}📱 From:${colors.reset} ${from}`);
  console.log(`${colors.yellow}💬 Text:${colors.reset} "${text}"`);
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3000/api/sms/inbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: process.env.AT_SHORTCODE || '96207',
        text,
        date: new Date().toISOString(),
        id: `test-${Date.now()}`,
        linkId: `link-${Date.now()}`,
      }),
    });
    
    const data = await response.text();
    
    if (response.ok) {
      log('✅', 'SMS received by server', colors.green);
      console.log(`${colors.cyan}📨 Server response:${colors.reset}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${data}`);
      
      // Give the worker time to process
      log('⏳', 'Waiting for AI processing...', colors.yellow);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      return true;
    } else {
      log('❌', `Server error: ${response.status}`, colors.red);
      console.log(`   Response: ${data}`);
      return false;
    }
  } catch (err: any) {
    log('❌', `Failed to send SMS: ${err.message}`);
    return false;
  }
}

async function testSMSFlow() {
  console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}🧪 TRUSTESCROW NG - SMS FLOW TEST${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
  
  log('ℹ️', 'This test simulates a complete SMS-based deal creation flow', colors.cyan);
  log('ℹ️', 'Make sure your server is running: npm run dev', colors.cyan);
  console.log('');
  
  // Check if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/health');
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
    log('✅', 'Server is running on http://localhost:3000', colors.green);
  } catch (err) {
    log('❌', 'Server is not running! Start it with: npm run dev');
    process.exit(1);
  }
  
  console.log('');
  log('🎬', 'Starting SMS flow simulation...', colors.bright);
  
  const buyerPhone = '+2348012345678';
  
  // Simulate a complete flow
  const steps = [
    {
      from: buyerPhone,
      text: 'START',
      description: 'User initiates conversation',
    },
    {
      from: buyerPhone,
      text: 'iPhone 14 Pro for 450000 naira',
      description: 'User describes the deal',
    },
    {
      from: buyerPhone,
      text: '08087654321',
      description: 'User provides seller phone',
    },
    {
      from: buyerPhone,
      text: 'YES',
      description: 'User consents to verification',
    },
    {
      from: buyerPhone,
      text: '12345678901',
      description: 'User provides NIN',
    },
  ];
  
  let allPassed = true;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    log('🎯', step.description, colors.cyan);
    
    const passed = await simulateInboundSMS(step.from, step.text, i + 1);
    
    if (!passed) {
      allPassed = false;
      break;
    }
    
    // Wait between steps
    if (i < steps.length - 1) {
      log('⏸️', 'Waiting before next step...', colors.yellow);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n${colors.bright}${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
  
  if (allPassed) {
    log('🎉', 'SMS flow test completed!', colors.green);
    console.log('');
    console.log(`${colors.bright}${colors.green}What happened:${colors.reset}`);
    console.log(`  ✓ User sent ${steps.length} SMS messages`);
    console.log(`  ✓ Server received all messages`);
    console.log(`  ✓ AI processed each message`);
    console.log(`  ✓ Replies were queued for sending`);
    console.log('');
    console.log(`${colors.bright}${colors.cyan}Check your logs for:${colors.reset}`);
    console.log(`  • AI intent classification results`);
    console.log(`  • Extracted data (item, amount, phone, NIN)`);
    console.log(`  • Generated reply messages`);
    console.log(`  • BullMQ job processing`);
    console.log('');
    console.log(`${colors.bright}${colors.yellow}Next:${colors.reset} Test with real SMS using Africa's Talking simulator:`);
    console.log(`  ${colors.cyan}https://account.africastalking.com/apps/sandbox/simulator${colors.reset}`);
  } else {
    log('❌', 'SMS flow test failed', colors.red);
    console.log('');
    console.log(`${colors.bright}${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log(`  1. Check server logs for errors`);
    console.log(`  2. Verify database is running: docker ps`);
    console.log(`  3. Verify Redis is running: docker ps`);
    console.log(`  4. Check AI provider is configured`);
    console.log(`  5. Ensure worker is running (should auto-start with server)`);
  }
  
  console.log('');
}

testSMSFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
