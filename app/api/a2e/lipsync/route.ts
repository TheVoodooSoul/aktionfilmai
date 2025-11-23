import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { image, avatarId, audio, text, userId } = await req.json();

    // Build request body - prefer avatar_id for better consistency
    const requestBody: any = {
      audio: audio || null,
      text: text || null, // Will use TTS if audio not provided
      voice_id: 'action-hero-male', // Can be customized
      uncensored: true, // No content filtering for action dialogue
    };

    if (avatarId) {
      requestBody.avatar_id = avatarId;
      console.log('Using trained avatar:', avatarId);
    } else if (image) {
      requestBody.image = image;
      console.log('Using image');
    } else {
      return NextResponse.json(
        { error: 'Either image or avatarId is required' },
        { status: 400 }
      );
    }

    // Call A2E.AI lipsync API
    const response = await fetch(`${process.env.A2E_API_URL}/lipsyncs/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
