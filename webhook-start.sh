#!/bin/bash
# Start Stripe webhook listener and Next.js dev server

echo "🚀 Starting AktionFilmAI development environment..."

# Start Stripe webhook listener
echo "📡 Starting Stripe webhook listener..."
stripe listen --forward-to localhost:3000/api/stripe/webhook > /tmp/stripe-webhook.log 2>&1 &
STRIPE_PID=$!
echo $STRIPE_PID > /tmp/stripe-webhook.pid
echo "✅ Stripe webhook listener started (PID: $STRIPE_PID)"

# Wait a moment
sleep 2

# Start Next.js dev server
echo "🌐 Starting Next.js dev server..."
npm run dev > /tmp/nextjs-dev.log 2>&1 &
NEXT_PID=$!
echo $NEXT_PID > /tmp/nextjs-dev.pid
echo "✅ Next.js dev server started (PID: $NEXT_PID)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Everything is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Website: http://localhost:3000"
echo "🎟️  Token page: http://localhost:3000/contest/buy-token"
echo ""
echo "📝 Logs:"
echo "   Stripe: tail -f /tmp/stripe-webhook.log"
echo "   Next.js: tail -f /tmp/nextjs-dev.log"
echo ""
echo "🛑 To stop everything: ./webhook-stop.sh"
echo ""
