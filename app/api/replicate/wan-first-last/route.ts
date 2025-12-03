import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

// Wan 2.2 First-Last Frame Interpolation
// Model: lucataco/wan-2.2-first-last-frame
// Use case: Generate smooth video transition between two keyframes

export async function POST(req: NextRequest) {
  try {
    const {
      firstFrame,
      lastFrame,
      prompt,
      negativePrompt,
      numFrames = 81,
      guidanceScale = 5,
      steps = 30,
      userId
    } = await req.json();

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    if (!firstFrame || !lastFrame) {
      return NextResponse.json(
        { error: 'Both first frame and last frame are required' },
        { status: 400 }
      );
    }

    console.log('Wan 2.2 First-Last Request:', {
      hasFirstFrame: !!firstFrame,
      hasLastFrame: !!lastFrame,
      prompt: prompt?.substring(0, 100),
      numFrames,
    });

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const input: Record<string, any> = {
      first_frame: firstFrame,
      last_frame: lastFrame,
      prompt: prompt || 'smooth motion transition, cinematic, high quality',
      num_frames: numFrames,
      guidance_scale: guidanceScale,
      num_inference_steps: steps,
    };

    if (negativePrompt) {
      input.negative_prompt = negativePrompt;
    }

    const output = await replicate.run(
      "lucataco/wan-2.2-first-last-frame:003fd8a38ff17cb6022c3117bb90f7403cb632062ba2b098710738d116847d57",
      { input }
    );

    console.log('Wan 2.2 First-Last output type:', typeof output);

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
        { error: 'No video generated from Wan 2.2 First-Last' },
        { status: 500 }
      );
    }

    console.log('Wan 2.2 First-Last output URL:', videoUrl.substring(0, 100));

    // Deduct credits (60 credits for frame interpolation)
    const creditCost = 60;
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
            description: 'Wan 2.2 First-Last Frame Interpolation (Replicate)',
          });
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Wan 2.2 First-Last error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
