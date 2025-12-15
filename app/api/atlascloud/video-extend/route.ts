import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * AtlasCloud Wan 2.5 Video Extend (Fast)
 * Extends existing video clips
 */

const ATLASCLOUD_API_URL = 'https://api.atlascloud.ai/api/v1/model/generateVideo';
const ATLASCLOUD_POLL_URL = 'https://api.atlascloud.ai/api/v1/model/prediction';

export async function POST(req: NextRequest) {
  try {
    const {
      video,
      prompt,
      negativePrompt,
      duration = 5,
      resolution = '720p',
      seed = -1,
      userId,
    } = await req.json();

    if (!process.env.ATLASCLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'AtlasCloud API key not configured' },
        { status: 500 }
      );
    }

    if (!video) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Check and deduct credits BEFORE API call
    const creditCost = 40; // Video extend
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < creditCost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${creditCost} credits for video extend.` },
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
          description: 'AtlasCloud Video Extend',
        });
    }

    console.log('AtlasCloud Video Extend Request:', {
      hasVideo: !!video,
      prompt: prompt?.substring(0, 50),
      duration,
      resolution,
    });

    // Call AtlasCloud API
    const response = await fetch(ATLASCLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ATLASCLOUD_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'alibaba/wan-2.5/video-extend-fast',
        video,
        prompt: prompt || 'continue the action seamlessly, maintain momentum',
        negative_prompt: negativePrompt || 'blur, static, freeze, jump cut',
        duration,
        resolution,
        seed,
        enable_prompt_expansion: false,
      }),
    });

    const result = await response.json();
    console.log('AtlasCloud Video Extend initial response:', result);

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
        { error: result.message || 'Failed to start video extend' },
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
          { error: pollResult.data.error || 'Video extend failed' },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!videoUrl) {
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
        { error: 'Video extend timed out. Credits refunded.' },
        { status: 408 }
      );
    }

    console.log('AtlasCloud Video Extend output:', videoUrl);

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
      provider: 'atlascloud',
      model: 'wan-2.5/video-extend-fast',
    });
  } catch (error: any) {
    console.error('AtlasCloud Video Extend error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extend video' },
      { status: 500 }
    );
  }
}
