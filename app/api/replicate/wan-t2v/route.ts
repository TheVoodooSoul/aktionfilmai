import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

/**
 * Wan Text-to-Video (Replicate)
 * Generate video from text prompt using Wan 2.2
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, negativePrompt, numFrames = 49, userId } = await req.json();

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Wan T2V Request:', {
      prompt: prompt?.substring(0, 100),
      numFrames,
    });

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const input: Record<string, any> = {
      prompt,
      num_frames: numFrames,
      guidance_scale: 7.5,
    };

    if (negativePrompt) {
      input.negative_prompt = negativePrompt;
    }

    // Use Wan 2.2 fast for text-to-video
    const output = await replicate.run(
      "wan-video/wan-2.2-5b-fast",
      { input }
    );

    console.log('Wan T2V output type:', typeof output);

    // Handle FileOutput object
    let videoUrl: string | null = null;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (Array.isArray(output)) {
      const first = output[0];
      videoUrl = typeof first === 'string' ? first :
                 typeof first?.url === 'function' ? first.url() : String(first);
    } else if (output && typeof output === 'object') {
      if (typeof (output as any).url === 'function') {
        videoUrl = (output as any).url();
      } else if (typeof (output as any).url === 'string') {
        videoUrl = (output as any).url;
      } else {
        videoUrl = String(output);
      }
    }

    if (!videoUrl || videoUrl === '[object Object]') {
      return NextResponse.json(
        { error: 'No video generated from Wan T2V' },
        { status: 500 }
      );
    }

    console.log('Wan T2V output URL:', videoUrl.substring(0, 100));

    // Deduct credits
    const creditCost = 40;
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
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
            description: 'Wan Text to Video (Replicate)',
          });
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Wan T2V error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
