import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const {
      characters,
      environment,
      action,
      prompt,
      creativity,
      userId
    } = await req.json();

    // Call RunPod serverless endpoint with MickMumpitz Scene-Builder workflow
    const response = await fetch(`${process.env.RUNPOD_SCENE_BUILDER_ENDPOINT}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          workflow: 'scene-builder-1.1',
          characters: characters || [], // Array of character image URLs
          environment: environment || 'none',
          action_type: action || 'fight',
          prompt: prompt || '',
          creativity: creativity || 0.7,
          model: 'qwen-edit-360', // Your custom uncensored model
        },
      }),
    });

    if (!response.ok) {
      throw new Error('RunPod API error');
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
            description: 'Scene builder (RunPod)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: data.output?.image || data.output,
      status: 'success',
    });
  } catch (error) {
    console.error('RunPod scene-builder error:', error);
    return NextResponse.json(
      { error: 'Failed to build scene' },
      { status: 500 }
    );
  }
}
