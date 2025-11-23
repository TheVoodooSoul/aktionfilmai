import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * A2E Add Face Swap Image API
 * Add face image to user's library for face swapping
 */
export async function POST(req: NextRequest) {
  try {
    const { faceUrl, userId } = await req.json();

    console.log('Add Face Image Request:', {
      faceUrl,
      userId,
    });

    if (!faceUrl) {
      return NextResponse.json(
        { error: 'faceUrl (public URL) is required' },
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

    // Cost for adding face (assuming 3 credits)
    const cost = 3;

    if (cost > 0 && userId) {
      // Check credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < cost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${cost} credits to add face image.` },
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

    // Call A2E Add Face Swap Image API
    const response = await fetch('https://video.a2e.ai/api/v1/userFaceSwapImage/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        face_url: faceUrl,
      }),
    });

    console.log('A2E Add Face Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Add Face Response:', responseText.substring(0, 500));

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

    console.log('Face Image Added:', {
      faceId: data.data?.[0]?._id,
      cost,
    });

    return NextResponse.json({
      success: true,
      faces: data.data,
      cost,
      message: 'Face added to library',
    });
  } catch (error) {
    console.error('Add face error:', error);
    return NextResponse.json(
      { error: 'Failed to add face image' },
      { status: 500 }
    );
  }
}
