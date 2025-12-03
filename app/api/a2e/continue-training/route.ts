import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * A2E Continue Training API (Studio Avatar 💠)
 * Trains a personalized lip-sync model for better quality
 * This is optional but recommended for optimal results
 */
export async function POST(req: NextRequest) {
  try {
    const { avatarId, userId } = await req.json();

    console.log('Continue Training Request:', {
      avatarId,
      userId,
    });

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatarId (_id from startTraining) is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Continue training cost (check A2E docs for actual cost - assuming 20 credits)
    const cost = 20;

    if (cost > 0 && userId) {
      // Check credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < cost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${cost} credits for Studio Avatar training.` },
          { status: 400 }
        );
      }

      // Deduct credits
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - cost })
        .eq('id', userId);

      if (deductError) {
        console.error('Failed to deduct credits:', deductError);
        return NextResponse.json(
          { error: 'Failed to deduct credits' },
          { status: 500 }
        );
      }
    }

    // Call A2E Continue Training API (Studio Avatar)
    // Note: A2E has a typo in their endpoint - 'Tranining' instead of 'Training'
    const response = await fetch('https://video.a2e.ai/api/v1/userVideoTwin/continueTranining', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        _id: avatarId,
      }),
    });

    console.log('A2E Continue Training Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Continue Training Response:', responseText.substring(0, 500));

    if (!response.ok) {
      // Refund credits on failure
      if (cost > 0 && userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits + cost })
            .eq('id', userId);
        }
      }

      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0) {
      // Refund credits on API error
      if (cost > 0 && userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits + cost })
            .eq('id', userId);
        }
      }

      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    console.log('Continue Training Started:', {
      avatarId,
      cost,
    });

    return NextResponse.json({
      success: true,
      avatar_id: avatarId,
      status: 'training',
      cost,
      message: 'Studio Avatar training started! This will improve lip-sync quality.',
    });
  } catch (error) {
    console.error('Continue training error:', error);
    return NextResponse.json(
      { error: 'Failed to continue training' },
      { status: 500 }
    );
  }
}
