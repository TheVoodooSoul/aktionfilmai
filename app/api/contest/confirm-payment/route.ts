import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, submissionId } = await request.json();

    if (!paymentIntentId || !submissionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Update submission status
    const { data: submission, error: updateError } = await supabase
      .from('contest_submissions')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .eq('payment_intent_id', paymentIntentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm submission' },
        { status: 500 }
      );
    }

    // Update contest pot
    const { error: potError } = await supabase.rpc('increment', {
      table_name: 'contests',
      column_name: 'total_pot',
      row_id: submission.contest_id,
      increment_by: submission.amount_paid,
    });

    // Update user's submission count
    const { error: profileError } = await supabase.rpc('increment', {
      table_name: 'profiles',
      column_name: 'contest_submissions_count',
      row_id: submission.user_id,
      increment_by: 1,
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
