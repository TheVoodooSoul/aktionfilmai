import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Generate unique token code
function generateTokenCode(): string {
  return `AKT-${randomBytes(8).toString('hex').toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const { contestId, userId, isFirstPurchase } = paymentIntent.metadata;

    if (!contestId || !userId) {
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if token already exists for this payment
    const { data: existingToken } = await supabase
      .from('submission_tokens')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (existingToken) {
      // Token already created, return it
      return NextResponse.json({
        success: true,
        token: existingToken,
      });
    }

    // Generate unique token code
    let tokenCode = generateTokenCode();
    let attempts = 0;
    let isUnique = false;

    // Ensure token code is unique
    while (!isUnique && attempts < 5) {
      const { data: existing } = await supabase
        .from('submission_tokens')
        .select('id')
        .eq('token_code', tokenCode)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        tokenCode = generateTokenCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique token' },
        { status: 500 }
      );
    }

    // Create the token
    const { data: token, error: tokenError } = await supabase
      .from('submission_tokens')
      .insert({
        user_id: userId,
        contest_id: contestId,
        token_code: tokenCode,
        payment_intent_id: paymentIntentId,
        amount_paid: paymentIntent.amount,
        submission_allowance: 1,
        votes_remaining: 3,
        is_first_purchase: isFirstPurchase === 'true',
        status: 'active',
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to create token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Error confirming token payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
