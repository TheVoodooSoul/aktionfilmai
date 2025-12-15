import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, avatarId, motionVideoUrl, prompt, userId } = await req.json();

    console.log('A2E Motion Transfer Request:', {
      hasImage: !!imageUrl,
      hasAvatar: !!avatarId,
      hasMotionVideo: !!motionVideoUrl,
      hasPrompt: !!prompt,
      userId,
    });

    if ((!imageUrl && !avatarId) || !motionVideoUrl) {
      return NextResponse.json(
        { error: 'Both character (image or avatar) and motion video are required' },
        { status: 400 }
      );
    }

    // Build request body - prefer avatar_id for better consistency
    const requestBody: any = {
      name: 'Action scene motion transfer',
      video_url: motionVideoUrl,
      positive_prompt: prompt || 'action scene, dynamic movement, cinematic, high quality',
      negative_prompt: 'blurry, ugly, duplicate, poorly drawn, deformed, static, low quality',
    };

    if (avatarId) {
      requestBody.user_video_twin_id = avatarId; // Use trained avatar
      console.log('Using trained avatar:', avatarId);
    } else {
      requestBody.image_url = imageUrl; // Fallback to image
      console.log('Using image URL');
    }

    // Call A2E Motion Transfer API
    const response = await fetch('https://video.a2e.ai/api/v1/motionTransfer/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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

    // Poll for completion (max 180 seconds, check every 5 seconds)
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 36;

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/motionTransfer/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        videoUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'A2E motion transfer failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Motion transfer timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct 5 credits from user (skip for super admin)
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
          .update({ credits: profile.credits - 5 })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -5,
            transaction_type: 'animation',
            description: 'Motion transfer (A2E)',
          });
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
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
