// apps/api/test-dispute-flow.ts
// Quick test script for dispute flow with AI mediation

import { prisma } from './src/db/prisma';
import { collectEvidence } from './src/services/dispute/dispute.service';

async function testDisputeFlow() {
  console.log('🧪 Testing Dispute Flow with AI Mediation\n');

  try {
    // 1. Find an active deal or create a test scenario
    console.log('1️⃣  Looking for a deal with dispute...');
    
    const deal = await prisma.deal.findFirst({
      where: {
        status: 'DISPUTE_OPEN',
      },
      include: {
        buyer: true,
        seller: true,
        dispute: true,
      },
    });

    if (!deal || !deal.dispute) {
      console.log('❌ No active dispute found. Create one first using the interactive demo.');
      console.log('\nTo test:');
      console.log('  1. Run: npx tsx interactive-demo.ts');
      console.log('  2. Complete a deal up to delivery');
      console.log('  3. Text DISPUTE instead of RECEIVED');
      console.log('  4. Then run this test script again\n');
      return;
    }

    console.log(`✅ Found dispute for deal: ${deal.dealRef}`);
    console.log(`   Status: ${deal.dispute.status}`);

    // 2. Test buyer evidence submission
    console.log('\n2️⃣  Submitting BUYER evidence...');
    const buyerEvidence = 'The seller sent me a broken iPhone 13. The screen is cracked and the phone does not turn on. I have photos as proof. I paid ₦80,000 for a working phone, not a broken one.';
    
    const buyerResult = await collectEvidence(
      deal.dispute.id,
      deal.buyer.id,
      buyerEvidence
    );
    console.log(`   Result: ${buyerResult.message}`);

    // 3. Test seller evidence submission
    console.log('\n3️⃣  Submitting SELLER evidence...');
    const sellerEvidence = 'I packaged the iPhone 13 perfectly. It was in pristine condition when I shipped it. I have the delivery receipt showing it was delivered intact. The buyer must have damaged it after receiving it.';
    
    const sellerResult = await collectEvidence(
      deal.dispute.id,
      deal.seller!.id,
      sellerEvidence
    );
    console.log(`   Result: ${sellerResult.message}`);

    // 4. Check final dispute status
    console.log('\n4️⃣  Checking dispute resolution...');
    const resolvedDispute = await prisma.dispute.findUnique({
      where: { id: deal.dispute.id },
      include: {
        deal: true,
      },
    });

    console.log(`   Status: ${resolvedDispute?.status}`);
    if (resolvedDispute?.aiAssessment) {
      console.log(`   AI Assessment: ${resolvedDispute.aiAssessment}`);
    }
    if (resolvedDispute?.resolvedFor) {
      console.log(`   ✅ Resolved in favor of: ${resolvedDispute.resolvedFor}`);
    }
    if (resolvedDispute?.resolution) {
      console.log(`   Resolution: ${resolvedDispute.resolution}`);
    }

    console.log('\n✅ Dispute flow test complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDisputeFlow();
