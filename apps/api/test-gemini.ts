// Quick test script for Gemini AI integration
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-exp';

if (!GEMINI_API_KEY) {
  throw new Error('Set GEMINI_API_KEY before running this test.');
}

async function testGemini() {
  console.log('🧪 Testing Gemini AI Integration...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const testPrompt = `You are TrustEscrow NG, an SMS-based escrow agent.

User message: "START"

Respond with ONLY this JSON (no markdown, no extra text):
{
  "intent": "START_DEAL",
  "extractedData": {},
  "replyMessage": "Welcome to TrustEscrow! What are you buying/selling and for how much?",
  "confidence": 0.95,
  "requiresClarification": false
}`;

    console.log('📤 Sending test request to Gemini...');
    const result = await model.generateContent(testPrompt);
    const response = result.response;
    const text = response.text();
    
    console.log('📥 Raw Response:');
    console.log(text);
    console.log('\n');

    // Clean and parse
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    console.log('✅ Parsed Response:');
    console.log(JSON.stringify(parsed, null, 2));
    console.log('\n');
    
    // Validate structure
    const requiredFields = ['intent', 'extractedData', 'replyMessage', 'confidence', 'requiresClarification'];
    const hasAllFields = requiredFields.every(field => field in parsed);
    
    if (hasAllFields) {
      console.log('✅ Response structure is valid!');
      console.log(`✅ SMS Reply: "${parsed.replyMessage}"`);
      console.log(`✅ Reply length: ${parsed.replyMessage.length} chars (limit: 160)`);
      
      if (parsed.replyMessage.length <= 160) {
        console.log('\n🎉 Gemini integration is working perfectly!');
      } else {
        console.log('\n⚠️  Warning: Reply message exceeds 160 characters');
      }
    } else {
      console.log('❌ Response missing required fields');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

testGemini();
