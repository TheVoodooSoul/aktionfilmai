import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * A2E Add Custom Background API
 * Add custom background image to user's library
 * Requires public URL to image
 */
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, userId } = await req.json();

    console.log('Add Background Request:', {
      imageUrl,
      userId,
    });

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl (public URL) is required' },
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

    // Cost for adding background (assuming 5 credits - verify with A2E docs)
    const cost = 5;

    if (cost > 0 && userId) {
      // Check credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < cost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${cost} credits to add background.` },
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

    // Call A2E Add Background API
    const response = await fetch('https://video.a2e.ai/api/v1/custom_back/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        img_url: imageUrl,
      }),
    });

    console.log('A2E Add Background Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Add Background Response:', responseText.substring(0, 500));

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

    console.log('Background Added:', {
      backgroundId: data.data._id,
      cost,
    });

    return NextResponse.json({
      success: true,
      background: data.data,
      cost,
      message: 'Background added to your library',
    });
  } catch (error) {
    console.error('Add background error:', error);
    return NextResponse.json(
      { error: 'Failed to add background' },
      { status: 500 }
    );
  }
}
