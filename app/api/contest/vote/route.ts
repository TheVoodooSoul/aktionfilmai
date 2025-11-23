import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { submissionId, userId, voteType } = await request.json();

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

    // Record vote
    const { error: voteError } = await supabase
      .from('contest_votes')
      .insert({
        submission_id: submissionId,
        user_id: userId,
        vote_type: voteType,
      });

    if (voteError) {
      console.error('Error recording vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
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

    return NextResponse.json({ success: true });
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
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const userId = searchParams.get('userId');
    const voteType = searchParams.get('voteType');

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
