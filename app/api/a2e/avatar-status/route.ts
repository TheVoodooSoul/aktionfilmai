import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Check avatar training status and update database
 * GET /api/a2e/avatar-status?avatar_id=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const avatarId = searchParams.get('avatar_id');

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatar_id is required' },
        { status: 400 }
      );
    }

    console.log('Checking avatar status for:', avatarId);

    // Call A2E to get avatar status using correct endpoint
    const response = await fetch(`https://video.a2e.ai/api/v1/userVideoTwin/${avatarId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
    });

    if (!response.ok) {
      console.error('A2E avatar status check failed:', response.status);
      return NextResponse.json(
        { error: 'Failed to check avatar status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Avatar status response:', data);

    // A2E avatar status can be: pending, training, completed, failed
    const status = data.data?.status || 'unknown';
    const isComplete = status === 'completed' || status === 'done';
    const isFailed = status === 'failed' || status === 'error';

    // Update database if status changed
    if (isComplete || isFailed) {
      const newStatus = isComplete ? 'completed' : 'failed';

      const { error } = await supabase
        .from('character_references')
        .update({ avatar_status: newStatus })
        .eq('avatar_id', avatarId);

      if (error) {
        console.error('Failed to update avatar status in database:', error);
      } else {
        console.log(`✓ Updated avatar ${avatarId} status to: ${newStatus}`);
      }
    }

    return NextResponse.json({
      avatar_id: avatarId,
      status: status,
      is_complete: isComplete,
      is_failed: isFailed,
      raw_data: data.data,
    });
  } catch (error) {
    console.error('Avatar status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check avatar status' },
      { status: 500 }
    );
  }
}

/**
 * Poll avatar status until completion
 * POST /api/a2e/avatar-status
 * Body: { avatar_id: string, max_attempts?: number, interval_ms?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { avatar_id, max_attempts = 60, interval_ms = 5000 } = await req.json();

    if (!avatar_id) {
      return NextResponse.json(
        { error: 'avatar_id is required' },
        { status: 400 }
      );
    }

    console.log(`Polling avatar ${avatar_id} - max ${max_attempts} attempts, ${interval_ms}ms interval`);

    let attempts = 0;
    while (attempts < max_attempts) {
      // Check status using correct endpoint
      const response = await fetch(`https://video.a2e.ai/api/v1/userVideoTwin/${avatar_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
          'Content-Type': 'application/json',
          'x-lang': 'en-US',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const status = data.data?.status || 'unknown';

        console.log(`Polling attempt ${attempts + 1}/${max_attempts}: ${status}`);

        if (status === 'completed' || status === 'done') {
          // Update database
          await supabase
            .from('character_references')
            .update({ avatar_status: 'completed' })
            .eq('avatar_id', avatar_id);

          return NextResponse.json({
            avatar_id,
            status: 'completed',
            attempts: attempts + 1,
            message: 'Avatar training completed successfully',
          });
        }

        if (status === 'failed' || status === 'error') {
          // Update database
          await supabase
            .from('character_references')
            .update({ avatar_status: 'failed' })
            .eq('avatar_id', avatar_id);

          return NextResponse.json({
            avatar_id,
            status: 'failed',
            attempts: attempts + 1,
            error: 'Avatar training failed',
          }, { status: 500 });
        }
      }

      attempts++;

      // Wait before next attempt (unless it's the last one)
      if (attempts < max_attempts) {
        await new Promise(resolve => setTimeout(resolve, interval_ms));
      }
    }

    // Timeout
    return NextResponse.json({
      avatar_id,
      status: 'timeout',
      attempts,
      message: 'Avatar training status check timed out. Training may still be in progress.',
    }, { status: 408 });
  } catch (error) {
    console.error('Avatar polling error:', error);
    return NextResponse.json(
      { error: 'Failed to poll avatar status' },
      { status: 500 }
    );
  }
}
