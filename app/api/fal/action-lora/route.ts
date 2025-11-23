import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// LoRA URL mapping - Direct FAL URLs (no manual linking needed!)
const LORA_URL_MAPPING: Record<string, string> = {
  punch: 'https://v3.fal.media/files/zebra/-x8yySPU3oiXHfqjG_wtN_adapter_model.safetensors',
  kick: 'https://v3.fal.media/files/rabbit/wHyoYJLx1pYifFifUNRV3_adapter_model.safetensors',
  takedown: 'https://v3b.fal.media/files/b/koala/91oSdDegjvEh4C0nEwXkA_adapter_model.safetensors',
};

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, actionType, userId } = await req.json();

    console.log('Action LoRA Request:', {
      hasImage: !!image,
      prompt,
      actionType,
      userId,
    });

    // Get LoRA URL based on action type
    const loraUrl = LORA_URL_MAPPING[actionType?.toLowerCase() || 'punch'];

    if (!loraUrl) {
      return NextResponse.json(
        { error: `Unknown action type: ${actionType}` },
        { status: 400 }
      );
    }

    // FAL ComfyUI workflow ID
    const FAL_WORKFLOW_ID = process.env.FAL_ACTION_LORA_WORKFLOW_ID || 'comfy/TheVoodooSoul/falactionloradirectjson';

    // Call FAL ComfyUI API for action pose generation with custom LoRA
    const response = await fetch(`https://queue.fal.run/fal-ai/${FAL_WORKFLOW_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        arguments: {
          SKETCH_IMAGE: image,
          PROMPT: prompt || `${actionType} pose, action scene, dynamic pose, cinematic lighting, high quality`,
          LORA_URL: loraUrl,
          RANDOM_SEED: Math.floor(Math.random() * 1000000),
        },
      }),
    });

    console.log('FAL Response status:', response.status);
    const responseText = await response.text();
    console.log('FAL Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `FAL API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);

    // FAL returns a request_id for queue-based processing
    const requestId = data.request_id;
    console.log('FAL Request ID:', requestId);

    // Poll for completion (max 120 seconds, check every 3 seconds)
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 40;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      const statusResponse = await fetch(`https://queue.fal.run/fal-ai/${FAL_WORKFLOW_ID}/requests/${requestId}/status`, {
        headers: {
          'Authorization': `Key ${process.env.FAL_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts + 1}:`, statusData.status);

      if (statusData.status === 'COMPLETED' && statusData.response_url) {
        // Fetch the final result
        const resultResponse = await fetch(statusData.response_url, {
          headers: {
            'Authorization': `Key ${process.env.FAL_API_KEY}`,
          },
        });
        const resultData = await resultResponse.json();

        // FAL ComfyUI workflows return images in the output
        if (resultData.images && resultData.images.length > 0) {
          imageUrl = resultData.images[0].url;
        } else if (resultData.output && resultData.output.images) {
          imageUrl = resultData.output.images[0].url;
        }
        break;
      }

      if (statusData.status === 'FAILED') {
        return NextResponse.json(
          { error: 'FAL generation failed: ' + (statusData.error || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Generation timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct 1 credit from user (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && profile.credits > 0) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 1 })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -1,
            transaction_type: 'preview',
            description: `Action LoRA generation (${actionType})`,
          });
      }
    }

    return NextResponse.json({
      output_url: imageUrl,
      status: 'success',
    });
  } catch (error) {
    console.error('Fal Action LoRA generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
