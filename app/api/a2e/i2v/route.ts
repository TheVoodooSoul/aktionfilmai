import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, negativePrompt, userId } = await req.json();

    console.log('A2E Image-to-Video Request:', {
      hasImage: !!imageUrl,
      prompt,
      userId,
    });

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'imageUrl and prompt are required' },
        { status: 400 }
      );
    }

    // Call A2E Image-to-Video API (userImage2Video)
    // Generates 5-second 720p video from image
    // Cost: 100 credits, ~10 minutes
    const response = await fetch('https://video.a2e.ai/api/v1/userImage2Video/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Image to Video',
        image_url: imageUrl,
        prompt: prompt || 'the person is speaking. Looking at the camera. detailed eyes, clear teeth, static camera view point, still background',
        negative_prmpt: negativePrompt || 'six fingers, bad hands, lowres, low quality, worst quality, moving camera view point, still image',
      }),
    });

    console.log('A2E I2V Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E I2V Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);

    // Check if request was successful
    if (data.code !== 0 || !data.data) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    const taskId = data.data._id;
    console.log('A2E I2V Task ID:', taskId);

    // Poll for completion (max 15 minutes = 900 seconds, check every 5 seconds)
    // A2E docs say ~10 minutes under normal circumstances
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 180; // 15 minutes / 5 seconds

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userImage2Video/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`I2V polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        videoUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Image-to-Video generation failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video generation timed out after 15 minutes. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (100 credits per the A2E docs)
    if (userId) {
      const creditCost = 100;
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
            description: 'Image to Video (A2E - 5sec 720p)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E i2v error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
