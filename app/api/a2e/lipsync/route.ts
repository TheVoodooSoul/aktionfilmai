import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { image, audio, text, userId } = await req.json();

    // Call A2E.AI lipsync API
    const response = await fetch(`${process.env.A2E_API_URL}/lipsyncs/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        audio: audio || null,
        text: text || null, // Will use TTS if audio not provided
        voice_id: 'action-hero-male', // Can be customized
        uncensored: true, // No content filtering for action dialogue
      }),
    });

    if (!response.ok) {
      throw new Error('A2E.AI API error');
    }

    const data = await response.json();

    // Deduct credits
    if (userId) {
      const creditCost = 3;
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
            description: 'Lipsync generation (A2E.AI)',
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
    console.error('A2E lipsync error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lipsync video' },
      { status: 500 }
    );
  }
}
