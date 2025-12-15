import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { FIGHT_PRESETS, FAL_LORA_URLS } from '@/lib/preset-types';

export async function POST(req: NextRequest) {
  try {
    const { presetId, characterImageUrl, userId, customPrompt } = await req.json();

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Find the preset
    const preset = FIGHT_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    // Check FAL API key
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL API key not configured' },
        { status: 500 }
      );
    }

    // Check and deduct credits (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';
    const creditCost = preset.credits_cost;

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < creditCost) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            message: `This preset costs ${creditCost} credits.`,
            credits_needed: creditCost,
          },
          { status: 402 }
        );
      }

      // Deduct credits
      await supabase
        .from('profiles')
        .update({ credits: profile.credits - creditCost })
        .eq('id', userId);

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -creditCost,
          transaction_type: 'preset_generation',
          description: `Fight Preset: ${preset.name}`,
        });
    }

    // Get the appropriate LoRA URL from preset's lora_name
    const loraKey = preset.lora_name || 'punch';
    const loraUrl = FAL_LORA_URLS[loraKey as keyof typeof FAL_LORA_URLS] || FAL_LORA_URLS.punch;

    // Build the prompt
    const finalPrompt = customPrompt
      ? `${preset.master_prompt}, ${customPrompt}`
      : preset.master_prompt;

    console.log('FAL Preset Generation:', {
      preset: preset.name,
      category: preset.category,
      loraKey,
      loraUrl,
      hasCharacterImage: !!characterImageUrl,
    });

    // Call FAL Wan with LoRA
    // Using image-to-video if character image provided, otherwise text-to-video
    const endpoint = characterImageUrl
      ? 'https://queue.fal.run/fal-ai/wan/image-to-video'
      : 'https://queue.fal.run/fal-ai/wan/text-to-video';

    const requestBody: any = {
      prompt: finalPrompt,
      negative_prompt: preset.negative_prompt,
      num_frames: preset.num_frames,
      fps: preset.fps,
      guidance_scale: preset.guidance_scale,
      num_inference_steps: 30,
      seed: Math.floor(Math.random() * 1000000),
      loras: [
        {
          path: loraUrl,
          scale: preset.lora_strength,
        }
      ],
    };

    // Add image for I2V
    if (characterImageUrl) {
      requestBody.image_url = characterImageUrl;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FAL API error:', errorText);

      // Refund credits on failure
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
        { error: 'Failed to start generation' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // FAL returns a request_id for async processing
    return NextResponse.json({
      status: 'processing',
      request_id: data.request_id,
      preset: {
        id: preset.id,
        name: preset.name,
        credits_cost: creditCost,
      },
    });
  } catch (error: any) {
    console.error('Preset generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate preset' },
      { status: 500 }
    );
  }
}

// GET - Check status of generation
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('request_id');

  if (!requestId) {
    return NextResponse.json(
      { error: 'Request ID is required' },
      { status: 400 }
    );
  }

  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    return NextResponse.json(
      { error: 'FAL API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Check status
    const statusResponse = await fetch(
      `https://queue.fal.run/fal-ai/wan/requests/${requestId}/status`,
      {
        headers: {
          'Authorization': `Key ${falKey}`,
        },
      }
    );

    const statusData = await statusResponse.json();

    if (statusData.status === 'COMPLETED') {
      // Get the result
      const resultResponse = await fetch(
        `https://queue.fal.run/fal-ai/wan/requests/${requestId}`,
        {
          headers: {
            'Authorization': `Key ${falKey}`,
          },
        }
      );

      const resultData = await resultResponse.json();

      return NextResponse.json({
        status: 'completed',
        output_url: resultData.video?.url || resultData.output?.url,
        result: resultData,
      });
    }

    return NextResponse.json({
      status: statusData.status?.toLowerCase() || 'processing',
      queue_position: statusData.queue_position,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
