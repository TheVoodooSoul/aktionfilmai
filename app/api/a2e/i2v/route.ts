import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, userId } = await req.json();

    // Call A2E.AI image-to-video API (Wan 2.5)
    const response = await fetch(`${process.env.A2E_API_URL}/video/i2v`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        prompt: prompt || '',
        model: 'wan-2.5',
        duration: 4, // 4 second video
        uncensored: true, // No content filtering for action scenes
      }),
    });

    if (!response.ok) {
      throw new Error('A2E.AI API error');
    }

    const data = await response.json();

    // Deduct credits
    if (userId) {
      const creditCost = 8;
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && profile.credits >= creditCost) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - creditCost })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -creditCost,
            transaction_type: 'generation',
            description: 'Image to video (A2E Wan 2.5)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: data.video_url || data.output,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E i2v error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
