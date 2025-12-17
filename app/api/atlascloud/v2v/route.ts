import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * AtlasCloud Wan 2.6 Video-to-Video
 * Transform existing videos with prompts, multi-shot support
 */

const ATLASCLOUD_API_URL = 'https://api.atlascloud.ai/api/v1/model/generateVideo';
const ATLASCLOUD_POLL_URL = 'https://api.atlascloud.ai/api/v1/model/prediction';

export async function POST(req: NextRequest) {
  try {
    const {
      videos,
      video, // single video fallback
      prompt,
      negativePrompt,
      duration = 10,
      size = '1280*720',
      seed = -1,
      shotType = 'single',
      userId,
    } = await req.json();

    if (!process.env.ATLASCLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'AtlasCloud API key not configured' },
        { status: 500 }
      );
    }

    const videoList = videos || (video ? [video] : null);
    if (!videoList || videoList.length === 0) {
      return NextResponse.json(
        { error: 'At least one video URL is required' },
        { status: 400 }
      );
    }

    // Check and deduct credits BEFORE API call
    const creditCost = 55; // V2V transformation
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < creditCost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${creditCost} credits for V2V.` },
          { status: 402 }
        );
      }

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
          description: 'AtlasCloud Wan 2.6 V2V',
        });
    }

    console.log('AtlasCloud Wan 2.6 V2V Request:', {
      videoCount: videoList.length,
      prompt: prompt?.substring(0, 50),
      duration,
      size,
      shotType,
    });

    // Call AtlasCloud API
    const response = await fetch(ATLASCLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ATLASCLOUD_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'alibaba/wan-2.6/video-to-video',
        videos: videoList,
        prompt: prompt || 'enhance video quality, smooth motion',
        negative_prompt: negativePrompt || 'blur, artifacts, low quality',
        duration,
        size,
        seed,
        shot_type: shotType,
        enable_prompt_expansion: true,
      }),
    });

    const result = await response.json();
    console.log('AtlasCloud Wan 2.6 V2V initial response:', result);

    if (!response.ok || !result.data?.id) {
      // Refund on failure
      if (userId && !isSuperAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();
        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits + creditCost })
            .eq('id', userId);
        }
      }
      return NextResponse.json(
        { error: result.message || 'Failed to start video transformation' },
        { status: 500 }
      );
    }

    const predictionId = result.data.id;

    // Poll for result (max 5 minutes)
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 150;

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollResponse = await fetch(`${ATLASCLOUD_POLL_URL}/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.ATLASCLOUD_API_KEY}`,
        },
      });

      const pollResult = await pollResponse.json();
      console.log(`AtlasCloud poll attempt ${attempts + 1}:`, pollResult.data?.status);

      if (pollResult.data?.status === 'completed' || pollResult.data?.status === 'succeeded') {
        videoUrl = pollResult.data.outputs?.[0];
        break;
      } else if (pollResult.data?.status === 'failed') {
        // Refund on failure
        if (userId && !isSuperAdmin) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();
          if (profile) {
            await supabase
              .from('profiles')
              .update({ credits: profile.credits + creditCost })
              .eq('id', userId);
          }
        }
        return NextResponse.json(
          { error: pollResult.data.error || 'Video transformation failed' },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!videoUrl) {
      // Refund on timeout
      if (userId && !isSuperAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();
        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits + creditCost })
            .eq('id', userId);
        }
      }
      return NextResponse.json(
        { error: 'Video transformation timed out. Credits refunded.' },
        { status: 408 }
      );
    }

    console.log('AtlasCloud Wan 2.6 V2V output:', videoUrl);

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
      provider: 'atlascloud',
      model: 'wan-2.6/video-to-video',
    });
  } catch (error: any) {
    console.error('AtlasCloud Wan 2.6 V2V error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transform video' },
      { status: 500 }
    );
  }
}
