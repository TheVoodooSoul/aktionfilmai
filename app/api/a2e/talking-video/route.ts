import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, audioUrl, duration, prompt, userId } = await req.json();

    console.log('A2E Talking Video Request:', {
      hasVideo: !!videoUrl,
      hasAudio: !!audioUrl,
      duration,
      hasPrompt: !!prompt,
      userId,
    });

    if (!videoUrl || !audioUrl) {
      return NextResponse.json(
        { error: 'Both video and audio are required' },
        { status: 400 }
      );
    }

    // Call A2E Talking Video API
    const response = await fetch('https://video.a2e.ai/api/v1/talkingVideo/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Action dialogue',
        video_url: videoUrl,
        audio_url: audioUrl,
        duration: duration || 5,
        prompt: prompt || 'character speaking with emotion, natural lip sync',
        negative_prompt: 'blurry, distorted, unnatural movement',
      }),
    });

    console.log('A2E Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Response:', responseText.substring(0, 500));

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
    console.log('A2E Task ID:', taskId);

    // Poll for completion (max 120 seconds, check every 3 seconds)
    let resultVideoUrl = null;
    let attempts = 0;
    const maxAttempts = 40;

    while (attempts < maxAttempts && !resultVideoUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/talkingVideo/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultVideoUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'A2E talking video failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultVideoUrl) {
      return NextResponse.json(
        { error: 'Talking video generation timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct 3 credits from user (skip for super admin)
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
          .update({ credits: profile.credits - 3 })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -3,
            transaction_type: 'dialogue',
            description: 'Talking video generation (A2E)',
          });
      }
    }

    return NextResponse.json({
      output_url: resultVideoUrl,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Talking Video error:', error);
    return NextResponse.json(
      { error: 'Failed to generate talking video' },
      { status: 500 }
    );
  }
}
