import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

// Wan 2.2 Animate - Character animation and motion
// Models: wan-video/wan-2.2-animate-animation, wan-video/wan-2.2-animate-replace
// Use case: Animate characters or replace elements in video

export async function POST(req: NextRequest) {
  try {
    const {
      image,
      prompt,
      negativePrompt,
      mode = 'animation', // 'animation' or 'replace'
      numFrames = 81,
      guidanceScale = 5,
      userId
    } = await req.json();

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    console.log('Wan 2.2 Animate Request:', {
      hasImage: !!image,
      mode,
      prompt: prompt?.substring(0, 100),
      numFrames,
    });

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const input: Record<string, any> = {
      image,
      prompt: prompt || 'smooth animation, natural movement, high quality',
      num_frames: numFrames,
      guidance_scale: guidanceScale,
      disable_safety_checker: true,
    };

    if (negativePrompt) {
      input.negative_prompt = negativePrompt;
    }

    // Choose model based on mode
    const model = mode === 'replace'
      ? "wan-video/wan-2.2-animate-replace"
      : "wan-video/wan-2.2-animate-animation";

    const output = await replicate.run(model, { input });

    console.log('Wan 2.2 Animate output type:', typeof output);

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
        { error: 'No video generated from Wan 2.2 Animate' },
        { status: 500 }
      );
    }

    console.log('Wan 2.2 Animate output URL:', videoUrl.substring(0, 100));

    // Deduct credits (70 credits for animation)
    const creditCost = 70;
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
            description: `Wan 2.2 Animate ${mode} (Replicate)`,
          });
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Wan 2.2 Animate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
