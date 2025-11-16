import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { image, creativity, characterRefs, userId } = await req.json();

    // TODO: Replace with actual RunComfy workflow ID when provided
    const DZINE_WORKFLOW_ID = process.env.DZINE_WORKFLOW_ID || 'dzine-i2i-workflow';

    // Call RunComfy API for dzine i2i (sketch to image)
    const response = await fetch('https://api.runcomfy.com/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNCOMFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: DZINE_WORKFLOW_ID,
        deployment_id: process.env.RUNCOMFY_DEPLOYMENT_ID,
        input: {
          image,
          creativity: creativity || 0.7,
          character_references: characterRefs || [],
        },
      }),
    });

    if (!response.ok) {
      throw new Error('RunComfy API error');
    }

    const data = await response.json();

    // Deduct 1 credit from user
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && profile.credits > 0) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 1 })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -1,
            transaction_type: 'preview',
            description: 'Sketch preview generation',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: data.output_url || data.outputs?.[0]?.url,
      status: 'success',
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
