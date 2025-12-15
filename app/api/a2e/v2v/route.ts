import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Video-to-Video / Motion Transfer (A2E)
 * Transfer motion from a reference video to a character image
 * Uses A2E's Motion Transfer API
 */
export async function POST(req: NextRequest) {
  try {
    const {
      imageUrl,      // Character image to animate
      videoUrl,      // Motion reference video
      prompt,
      negativePrompt,
      userId
    } = await req.json();

    console.log('A2E Motion Transfer Request:', {
      hasImage: !!imageUrl,
      hasVideo: !!videoUrl,
      prompt: prompt?.substring(0, 50),
      userId,
    });

    if (!imageUrl || !videoUrl) {
      return NextResponse.json(
        { error: 'Both imageUrl and videoUrl are required' },
        { status: 400 }
      );
    }

    // Call A2E Motion Transfer API (Video-to-Video)
    const response = await fetch('https://video.a2e.ai/api/v1/motionTransfer/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Motion Transfer',
        image_url: imageUrl,
        video_url: videoUrl,
        positive_prompt: prompt || 'a person, high quality, detailed',
        negative_prompt: negativePrompt || 'blurry, ugly, duplicate, poorly drawn, deformed',
      }),
    });

    console.log('A2E Motion Transfer Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Motion Transfer Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0 || !data.data) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.data?.failed_message || data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    const taskId = data.data._id;
    console.log('A2E Motion Transfer Task ID:', taskId);

    // Poll for completion (max 15 minutes, check every 5 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 180; // 15 minutes / 5 seconds

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/motionTransfer/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Motion Transfer polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Motion Transfer failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Motion Transfer timed out after 15 minutes. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (120 credits for motion transfer)
    const creditCost = 120;
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
            description: 'Motion Transfer / Video-to-Video (A2E)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Motion Transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to transfer motion' },
      { status: 500 }
    );
  }
}
