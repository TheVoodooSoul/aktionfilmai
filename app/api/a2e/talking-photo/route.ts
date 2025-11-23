import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A2E Talking Photo API
 * Animate static photos with audio/speech
 */
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, audioUrl, duration, prompt, negativePrompt, name, userId } = await req.json();

    console.log('A2E Talking Photo Request:', {
      hasImageUrl: !!imageUrl,
      hasAudioUrl: !!audioUrl,
      duration,
      userId,
    });

    if (!imageUrl || !audioUrl) {
      return NextResponse.json(
        { error: 'Both image_url and audio_url are required' },
        { status: 400 }
      );
    }

    // Start talking photo task
    const response = await fetch('https://video.a2e.ai/api/v1/talkingPhoto/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Talking Photo',
        image_url: imageUrl,
        audio_url: audioUrl,
        duration: duration || 3,
        prompt: prompt || 'speaking, looking at the camera, detailed eyes, clear teeth, static view point, still background, elegant, clear facial features, stable camera, professional shooting angle',
        negative_prompt: negativePrompt || 'vivid colors, overexposed, flickering, blurry details, subtitles, logo, style, artwork, painting, image, static, overall grayish, worst quality, low quality, JPEG compression artifacts, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn face, deformed, disfigured, malformed limbs, fused fingers, motionless person, cluttered background, three legs, crowded background, walking backwards',
      }),
    });

    console.log('A2E Talking Photo Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Talking Photo Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    const taskId = data.data._id;
    console.log('A2E Talking Photo Task ID:', taskId);

    // Poll for completion (max 2 minutes, check every 3 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 40;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/talkingPhoto/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Talking photo polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Talking photo failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Talking photo timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (5 credits for talking photo)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const creditCost = 5;
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
            transaction_type: 'talking_photo',
            description: 'Talking photo (A2E)',
          });
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Talking Photo error:', error);
    return NextResponse.json(
      { error: 'Failed to create talking photo' },
      { status: 500 }
    );
  }
}
