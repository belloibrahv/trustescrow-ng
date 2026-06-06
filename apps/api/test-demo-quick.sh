#!/bin/bash
# Quick test to verify interactive-demo.ts loads without errors

echo "Testing interactive-demo.ts compilation..."

# Test TypeScript compilation
npx tsc --noEmit interactive-demo.ts

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful!"
    echo ""
    echo "To run the full interactive demo:"
    echo "  npx tsx interactive-demo.ts"
    echo ""
    echo "Make sure the server is running first:"
    echo "  npm run dev"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi
