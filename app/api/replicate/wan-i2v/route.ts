import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

// Wan 2.5 Image-to-Video
// Model: wan-video/wan-2.5-i2v
// Use case: Generate video from a single image with motion

export async function POST(req: NextRequest) {
  try {
    const {
      image,
      prompt,
      negativePrompt,
      numFrames = 81,
      fps = 16,
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

    console.log('Wan 2.5 I2V Request:', {
      hasImage: !!image,
      prompt: prompt?.substring(0, 100),
      numFrames,
      fps,
    });

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const input: Record<string, any> = {
      image,
      prompt: prompt || 'smooth motion, cinematic, high quality',
      num_frames: numFrames,
      fps,
      guidance_scale: guidanceScale,
    };

    if (negativePrompt) {
      input.negative_prompt = negativePrompt;
    }

    const output = await replicate.run(
      "wan-video/wan-2.5-i2v",
      { input }
    );

    console.log('Wan 2.5 I2V output type:', typeof output);

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
        { error: 'No video generated from Wan 2.5 I2V' },
        { status: 500 }
      );
    }

    console.log('Wan 2.5 I2V output URL:', videoUrl.substring(0, 100));

    // Deduct credits (80 credits for Wan 2.5 video)
    const creditCost = 80;
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
            description: 'Wan 2.5 Image-to-Video (Replicate)',
          });
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Wan 2.5 I2V error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
