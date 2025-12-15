import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { contestId, userId, userEmail } = await request.json();

    if (!contestId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if this is user's first token purchase for this contest
    const { data: existingTokens } = await supabase
      .from('submission_tokens')
      .select('id')
      .eq('contest_id', contestId)
      .eq('user_id', userId);

    const isFirstPurchase = !existingTokens || existingTokens.length === 0;

    // Get contest details for pricing
    const { data: contest } = await supabase
      .from('contests')
      .select('first_submission_price, additional_submission_price')
      .eq('id', contestId)
      .single();

    if (!contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    const amount = isFirstPurchase
      ? contest.first_submission_price // $10 = 1000 cents
      : contest.additional_submission_price; // $5 = 500 cents

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        contestId,
        userId,
        userEmail,
        type: 'submission_token',
        isFirstPurchase: isFirstPurchase.toString(),
      },
      receipt_email: userEmail,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      isFirstPurchase,
    });
  } catch (error) {
    console.error('Error creating token purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create token purchase' },
      { status: 500 }
    );
  }
}
