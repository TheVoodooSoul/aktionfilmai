import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { firstFrame, lastFrame, creativity, userId } = await req.json();

    // TODO: Replace with actual RunComfy workflow ID when provided
    const WAN_INPAINT_WORKFLOW_ID = process.env.WAN_INPAINT_WORKFLOW_ID || 'wan-inpaint-workflow';

    // Call RunComfy API for Wan inpaint (frame interpolation)
    const response = await fetch('https://api.runcomfy.com/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNCOMFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: WAN_INPAINT_WORKFLOW_ID,
        deployment_id: process.env.RUNCOMFY_DEPLOYMENT_ID,
        input: {
          first_frame: firstFrame,
          last_frame: lastFrame,
          creativity: creativity || 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('RunComfy API error');
    }

    const data = await response.json();

    // Deduct credits based on sequence length (adjust as needed)
    if (userId) {
      const creditCost = 5; // Adjust based on your pricing
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
            description: 'Sequence generation (Wan inpaint)',
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
    console.error('Sequence generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sequence' },
      { status: 500 }
    );
  }
}
