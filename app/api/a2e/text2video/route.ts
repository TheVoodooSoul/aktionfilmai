import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Text-to-Video (ModelsLab Wan 2.2)
 * Direct text-to-video generation using ModelsLab API
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, negativePrompt, userId, portrait, numFrames } = await req.json();

    console.log('Text2Video Request:', {
      prompt: prompt?.substring(0, 100),
      userId,
      portrait,
      numFrames,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call ModelsLab Text-to-Video Ultra API
    const modelsLabResponse = await fetch('https://modelslab.com/api/v6/video/text2video_ultra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY,
        prompt: prompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, extra limbs, missing limbs, broken fingers, deformed, glitch, artifacts, unrealistic, low resolution, bad anatomy, duplicate, cropped, watermark, text, logo, jpeg artifacts, noisy, oversaturated, underexposed, overexposed, flicker, unstable motion, motion blur, stretched, mutated, out of frame, bad proportions',
        portrait: portrait || false,
        resolution: '480',
        fps: '18',
        num_frames: (numFrames || 92).toString(),
        output_type: 'mp4',
        model_id: 'wan-2.2-t2v',
      }),
    });

    const modelsLabData = await modelsLabResponse.json();
    console.log('Text2Video response:', JSON.stringify(modelsLabData, null, 2));

    // Handle response
    let output: any = null;

    if (modelsLabData.status === 'success' && modelsLabData.output) {
      output = modelsLabData.output;
    } else if (modelsLabData.status === 'processing' && modelsLabData.fetch_result) {
      // Poll for result - video generation can take a while
      console.log('Text2Video processing, polling...');
      let attempts = 0;
      while (attempts < 180) { // 15 minutes max polling (5s intervals)
        await new Promise(resolve => setTimeout(resolve, 5000));
        const pollResponse = await fetch(modelsLabData.fetch_result, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: process.env.MODELSLAB_API_KEY }),
        });
        const pollData = await pollResponse.json();
        console.log('Poll attempt', attempts + 1, ':', pollData.status);
        if (pollData.status === 'success' && pollData.output) {
          output = pollData.output;
          break;
        } else if (pollData.status === 'failed') {
          throw new Error('Text2Video generation failed: ' + (pollData.message || 'Unknown error'));
        }
        attempts++;
      }
      if (!output) throw new Error('Text2Video generation timed out');
    } else if (modelsLabData.status === 'error') {
      throw new Error('Text2Video error: ' + (modelsLabData.message || 'Unknown'));
    }

    console.log('Text2Video output:', JSON.stringify(output, null, 2));

    // Extract video URL
    let outputVideoUrl: string | null = null;
    if (Array.isArray(output) && output.length > 0) {
      outputVideoUrl = output[0];
    } else if (typeof output === 'string') {
      outputVideoUrl = output;
    }

    if (!outputVideoUrl || !outputVideoUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'No video generated from Text2Video' },
        { status: 500 }
      );
    }

    // Deduct credits
    const creditCost = 10; // ModelsLab text2video cost
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
            description: 'Text to Video (ModelsLab Wan 2.2)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: outputVideoUrl,
      status: 'success',
      model: 'wan-2.2-t2v',
    });
  } catch (error: any) {
    console.error('Text2Video error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
