import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      tokenId,
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

    if (!tokenId || !contestId || !userId || !userEmail || !submissionName || !videoUrl) {
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

    // Validate token
    const { data: token, error: tokenError } = await supabase
      .from('submission_tokens')
      .select('*')
      .eq('id', tokenId)
      .eq('user_id', userId)
      .eq('contest_id', contestId)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'Token not found or invalid' },
        { status: 404 }
      );
    }

    // Check token status and allowance
    if (token.status !== 'active') {
      return NextResponse.json(
        { error: 'Token is not active' },
        { status: 400 }
      );
    }

    if (token.submission_allowance < 1) {
      return NextResponse.json(
        { error: 'Token has no submission allowance remaining' },
        { status: 400 }
      );
    }

    // Create submission record (approved since token is pre-paid)
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
        payment_intent_id: token.payment_intent_id,
        amount_paid: token.amount_paid,
        is_first_submission: token.is_first_purchase,
        status: 'approved', // Auto-approved since token is pre-paid
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

    // Update token - consume submission allowance
    const { error: updateError } = await supabase
      .from('submission_tokens')
      .update({
        submission_allowance: token.submission_allowance - 1,
        used_for_submission_at: new Date().toISOString(),
        status: token.submission_allowance - 1 === 0 && token.votes_remaining === 0 ? 'used' : 'active',
      })
      .eq('id', tokenId);

    if (updateError) {
      console.error('Error updating token:', updateError);
      // Submission was created, but token wasn't updated - log error but return success
    }

    // Increment contest pot
    const { error: potError } = await supabase
      .from('contests')
      .update({
        total_pot: contest.total_pot + token.amount_paid,
      })
      .eq('id', contestId);

    if (potError) {
      console.error('Error updating contest pot:', potError);
    }

    return NextResponse.json({
      success: true,
      submission,
      votesRemaining: token.votes_remaining,
    });
  } catch (error: any) {
    console.error('Contest submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process submission' },
      { status: 500 }
    );
  }
}

// Get user's available tokens for a contest
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const contestId = searchParams.get('contestId');

    if (!userId || !contestId) {
      return NextResponse.json(
        { error: 'userId and contestId are required' },
        { status: 400 }
      );
    }

    const { data: tokens, error } = await supabase
      .from('submission_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('contest_id', contestId)
      .eq('status', 'active')
      .gt('submission_allowance', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
