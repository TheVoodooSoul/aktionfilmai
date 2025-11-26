#!/bin/bash
# Stop Stripe webhook listener and Next.js dev server

echo "🛑 Stopping AktionFilmAI development environment..."

# Stop Stripe webhook
if [ -f /tmp/stripe-webhook.pid ]; then
    STRIPE_PID=$(cat /tmp/stripe-webhook.pid)
    kill $STRIPE_PID 2>/dev/null && echo "✅ Stopped Stripe webhook listener (PID: $STRIPE_PID)" || echo "⚠️  Stripe webhook listener not running"
    rm /tmp/stripe-webhook.pid
else
    echo "⚠️  No Stripe webhook PID file found"
fi

# Stop Next.js
if [ -f /tmp/nextjs-dev.pid ]; then
    NEXT_PID=$(cat /tmp/nextjs-dev.pid)
    kill $NEXT_PID 2>/dev/null && echo "✅ Stopped Next.js dev server (PID: $NEXT_PID)" || echo "⚠️  Next.js not running"
    rm /tmp/nextjs-dev.pid
else
    echo "⚠️  No Next.js PID file found"
fi

echo ""
echo "✨ All stopped!"
