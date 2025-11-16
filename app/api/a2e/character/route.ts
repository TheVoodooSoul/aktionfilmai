import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { prompt, referenceImage, userId } = await req.json();

    // Call A2E.AI character generation API
    const response = await fetch(`${process.env.A2E_API_URL}/avatars/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        reference_image: referenceImage,
        style: 'realistic',
        uncensored: true,
      }),
    });

    if (!response.ok) {
      throw new Error('A2E.AI API error');
    }

    const data = await response.json();

    // Deduct credits
    if (userId) {
      const creditCost = 2;
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
            description: 'Character generation (A2E.AI)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: data.image_url || data.output,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E character generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate character' },
      { status: 500 }
    );
  }
}
