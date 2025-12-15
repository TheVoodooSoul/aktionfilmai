import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/api/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { submissionId, userId, voteType, tokenId } = await request.json();

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch - cannot vote as another user' },
        { status: 403 }
      );
    }

    if (!submissionId || !userId || !voteType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('contest_votes')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('user_id', userId)
      .eq('vote_type', voteType)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted for this submission' },
        { status: 400 }
      );
    }

    // For community votes with token, validate and consume token vote allowance
    let token = null;
    if (voteType === 'community' && tokenId) {
      // Get token details
      const { data: tokenData, error: tokenError } = await supabase
        .from('submission_tokens')
        .select('*')
        .eq('id', tokenId)
        .eq('user_id', userId)
        .single();

      if (tokenError || !tokenData) {
        return NextResponse.json(
          { error: 'Token not found or invalid' },
          { status: 404 }
        );
      }

      token = tokenData;

      // Check if token has votes remaining
      if (token.votes_remaining < 1) {
        return NextResponse.json(
          { error: 'Token has no votes remaining' },
          { status: 400 }
        );
      }
    }

    // Record vote
    const { data: voteData, error: voteError } = await supabase
      .from('contest_votes')
      .insert({
        submission_id: submissionId,
        user_id: userId,
        vote_type: voteType,
      })
      .select()
      .single();

    if (voteError) {
      console.error('Error recording vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    // If using token, consume vote and track usage
    if (token && voteData) {
      // Decrement token votes_remaining
      const newVotesRemaining = token.votes_remaining - 1;
      const newStatus = token.submission_allowance === 0 && newVotesRemaining === 0 ? 'used' : 'active';

      const { error: updateTokenError } = await supabase
        .from('submission_tokens')
        .update({
          votes_remaining: newVotesRemaining,
          status: newStatus,
        })
        .eq('id', tokenId);

      if (updateTokenError) {
        console.error('Error updating token:', updateTokenError);
      }

      // Track token vote usage
      const { error: usageError } = await supabase
        .from('token_vote_usage')
        .insert({
          token_id: tokenId,
          vote_id: voteData.id,
        });

      if (usageError) {
        console.error('Error tracking token vote usage:', usageError);
      }
    }

    // Update vote count on submission
    const voteColumn = voteType === 'staff' ? 'staff_votes' : 'community_votes';

    const { data: submission, error: updateError } = await supabase
      .from('contest_submissions')
      .select(voteColumn)
      .eq('id', submissionId)
      .single();

    if (!updateError && submission) {
      const currentVotes = (submission as any)[voteColumn] || 0;
      await supabase
        .from('contest_submissions')
        .update({ [voteColumn]: currentVotes + 1 })
        .eq('id', submissionId);
    }

    return NextResponse.json({
      success: true,
      votesRemaining: token ? token.votes_remaining - 1 : null,
    });
  } catch (error: any) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process vote' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const userId = searchParams.get('userId');
    const voteType = searchParams.get('voteType');

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch - cannot modify another user\'s vote' },
        { status: 403 }
      );
    }

    if (!submissionId || !userId || !voteType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Remove vote
    const { error: deleteError } = await supabase
      .from('contest_votes')
      .delete()
      .eq('submission_id', submissionId)
      .eq('user_id', userId)
      .eq('vote_type', voteType);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to remove vote' },
        { status: 500 }
      );
    }

    // Decrement vote count
    const voteColumn = voteType === 'staff' ? 'staff_votes' : 'community_votes';

    const { data: submission } = await supabase
      .from('contest_submissions')
      .select(voteColumn)
      .eq('id', submissionId)
      .single();

    if (submission) {
      const currentVotes = (submission as any)[voteColumn] || 0;
      await supabase
        .from('contest_submissions')
        .update({ [voteColumn]: Math.max(0, currentVotes - 1) })
        .eq('id', submissionId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove vote error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
