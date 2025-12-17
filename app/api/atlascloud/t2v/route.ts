import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * AtlasCloud Wan 2.6 Text-to-Video
 * Latest model with multi-shot support, 1080p, up to 15s duration
 * Supports LoRAs for action content
 */

const ATLASCLOUD_API_URL = 'https://api.atlascloud.ai/api/v1/model/generateVideo';
const ATLASCLOUD_POLL_URL = 'https://api.atlascloud.ai/api/v1/model/prediction';

// Action LoRAs for fight moves
export const ACTION_LORAS = {
  punch: { name: 'action-punch-lora', weight: 0.8 },
  kick: { name: 'action-kick-lora', weight: 0.8 },
  takedown: { name: 'action-takedown-lora', weight: 0.8 },
  combo: { name: 'action-combo-lora', weight: 0.7 },
  dodge: { name: 'action-dodge-lora', weight: 0.7 },
};

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      negativePrompt,
      duration = 5,
      size = '1280*720',
      seed = -1,
      shotType = 'single',
      audio,
      loras = [],
      actionType,
      userId,
    } = await req.json();

    if (!process.env.ATLASCLOUD_API_KEY) {
      return NextResponse.json(
        { error: 'AtlasCloud API key not configured' },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check and deduct credits BEFORE API call
    // Higher cost for 1080p and multi-shot
    const is1080p = size.includes('1920') || size.includes('1080');
    const isMultiShot = shotType === 'multi';
    let creditCost = 50; // Base cost
    if (is1080p) creditCost += 15;
    if (isMultiShot) creditCost += 10;

    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < creditCost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${creditCost} credits for T2V.` },
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
          description: 'AtlasCloud Wan 2.6 T2V',
        });
    }

    // Build LoRA array
    const finalLoras = [...loras];
    if (actionType && ACTION_LORAS[actionType as keyof typeof ACTION_LORAS]) {
      const actionLora = ACTION_LORAS[actionType as keyof typeof ACTION_LORAS];
      finalLoras.push(actionLora);
    }

    console.log('AtlasCloud Wan 2.6 T2V Request:', {
      prompt: prompt?.substring(0, 50),
      duration,
      size,
      shotType,
      creditCost,
      loraCount: finalLoras.length,
    });

    // Call AtlasCloud API
    const response = await fetch(ATLASCLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ATLASCLOUD_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'alibaba/wan-2.6/text-to-video',
        prompt,
        negative_prompt: negativePrompt || 'blur, low quality, distortion, artifacts',
        duration,
        size,
        seed,
        shot_type: shotType,
        enable_prompt_expansion: true,
        ...(audio && { audio }),
        ...(finalLoras.length > 0 && { loras: finalLoras }),
      }),
    });

    const result = await response.json();
    console.log('AtlasCloud Wan 2.6 T2V initial response:', result);

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
        { error: result.message || 'Failed to start video generation' },
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
          { error: pollResult.data.error || 'Video generation failed' },
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
        { error: 'Video generation timed out. Credits refunded.' },
        { status: 408 }
      );
    }

    console.log('AtlasCloud Wan 2.6 T2V output:', videoUrl);

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
      provider: 'atlascloud',
      model: 'wan-2.6/text-to-video',
    });
  } catch (error: any) {
    console.error('AtlasCloud Wan 2.6 T2V error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
