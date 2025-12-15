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
    const {
      contestId,
      userId,
      userEmail,
      userName,
      submissionName,
      videoUrl,
      platform,
      description,
      duration,
    } = await request.json();

    if (!contestId || !userId || !userEmail || !submissionName || !videoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get contest details
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('*')
      .eq('id', contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json(
        { error: 'Contest not found' },
        { status: 404 }
      );
    }

    // Check if contest is still accepting submissions
    if (new Date() > new Date(contest.submission_deadline)) {
      return NextResponse.json(
        { error: 'Contest submission deadline has passed' },
        { status: 400 }
      );
    }

    // Check if user has already submitted to this contest
    const { data: existingSubmissions } = await supabase
      .from('contest_submissions')
      .select('id')
      .eq('contest_id', contestId)
      .eq('user_id', userId);

    const isFirstSubmission = !existingSubmissions || existingSubmissions.length === 0;
    const amount = isFirstSubmission
      ? contest.first_submission_price
      : contest.additional_submission_price;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        contestId,
        userId,
        userEmail,
        submissionName,
        type: 'contest_submission',
      },
      description: `Contest submission: ${submissionName}`,
    });

    // Create submission record (pending payment)
    const { data: submission, error: submissionError } = await supabase
      .from('contest_submissions')
      .insert({
        contest_id: contestId,
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        submission_name: submissionName,
        video_url: videoUrl,
        platform: platform || 'other',
        description,
        duration,
        payment_intent_id: paymentIntent.id,
        amount_paid: amount,
        is_first_submission: isFirstSubmission,
        status: 'pending_payment',
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      submissionId: submission.id,
      amount,
      isFirstSubmission,
    });
  } catch (error: any) {
    console.error('Contest submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process submission' },
      { status: 500 }
    );
  }
}
