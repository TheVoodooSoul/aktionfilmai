import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

// Wan VACE 14B - Video editing with reference images
// Model: prunaai/vace-14b
// Use case: Edit videos with character consistency using reference images

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      srcVideo,
      srcMask,
      srcRefImages,
      size = "1280*720",
      frameNum = 81,
      speedMode = "Lightly Juiced 🍊 (more consistent)",
      userId
    } = await req.json();

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

    console.log('Wan VACE Request:', {
      prompt: prompt.substring(0, 100),
      hasSrcVideo: !!srcVideo,
      hasSrcMask: !!srcMask,
      refImageCount: srcRefImages?.length || 0,
      size,
      frameNum,
      speedMode,
    });

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const input: Record<string, any> = {
      prompt,
      size,
      frame_num: frameNum,
      speed_mode: speedMode,
      sample_shift: 16,
      sample_steps: 50,
      sample_solver: "unipc",
      sample_guide_scale: 5,
      disable_safety_checker: true,
    };

    // Add optional inputs
    if (srcVideo) input.src_video = srcVideo;
    if (srcMask) input.src_mask = srcMask;
    if (srcRefImages && srcRefImages.length > 0) {
      input.src_ref_images = srcRefImages;
    }

    const output = await replicate.run(
      "prunaai/vace-14b:51299232dc3d0946d5f5ed74935d85243e172698f747d291460db1e6ef3669fb",
      { input }
    );

    console.log('Wan VACE output type:', typeof output);

    // Handle FileOutput object
    let videoUrl: string | null = null;
    if (typeof output === 'string') {
      videoUrl = output;
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
        { error: 'No video generated from Wan VACE' },
        { status: 500 }
      );
    }

    console.log('Wan VACE output URL:', videoUrl.substring(0, 100));

    // Deduct credits (50 credits for video generation)
    const creditCost = 50;
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
            description: 'Wan VACE video generation (Replicate)',
          });
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Wan VACE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
