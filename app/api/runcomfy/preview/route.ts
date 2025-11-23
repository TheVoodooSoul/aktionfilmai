import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, creativity, characterRefs, userId } = await req.json();

    console.log('Dzine Request (via RunComfy route):', {
      hasToken: !!process.env.DZINE_API_TOKEN,
      hasPrompt: !!prompt,
      hasImage: !!image,
    });

    // Call Dzine API for image-to-image
    const response = await fetch('https://papi.dzine.ai/openapi/v1/create_task_img2img', {
      method: 'POST',
      headers: {
        'Authorization': process.env.DZINE_API_TOKEN!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt || 'transform this image into a high quality action scene',
        style_code: 'Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2', // No Style v2 (natural/realistic)
        style_intensity: creativity || 0.5,
        structure_match: 0.7, // Preserve 70% of original structure
        quality_mode: 1, // High quality
        generate_slots: [1, 0, 0, 0], // Generate only 1 image for speed
        output_format: 'webp',
        images: [
          {
            base64_data: image, // Already in base64 format
          }
        ],
      }),
    });

    console.log('Dzine Response status:', response.status);
    const responseText = await response.text();
    console.log('Dzine Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `Dzine API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 200 || !data.data?.task_id) {
      return NextResponse.json(
        { error: 'Dzine API returned an error: ' + data.msg },
        { status: 500 }
      );
    }

    const taskId = data.data.task_id;
    console.log('Dzine Task ID:', taskId);

    // Poll for completion (max 60 seconds, check every 2 seconds)
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await fetch(`https://papi.dzine.ai/openapi/v1/get_task_progress/${taskId}`, {
        headers: {
          'Authorization': process.env.DZINE_API_TOKEN!,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts + 1}:`, statusData.data?.status);

      if ((statusData.data?.status === 'succeed' || statusData.data?.status === 'succeeded') && statusData.data?.generate_result_slots?.length > 0) {
        // Get first non-empty result
        imageUrl = statusData.data.generate_result_slots.find((url: string) => url && url.length > 0);
        break;
      }

      if (statusData.data?.status === 'failed') {
        return NextResponse.json(
          { error: 'Dzine generation failed: ' + (statusData.data?.error_reason || 'Unknown error') },
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
            description: 'Sketch to image generation (Dzine)',
          });
      }
    }

    return NextResponse.json({
      output_url: imageUrl,
      status: 'success',
    });
  } catch (error) {
    console.error('Dzine generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
