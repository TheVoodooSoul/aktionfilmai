import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A2E Face Swap API
 * Swap faces in videos for character consistency
 */
export async function POST(req: NextRequest) {
  try {
    const { faceUrl, videoUrl, name, userId } = await req.json();

    console.log('A2E Face Swap Request:', {
      hasFaceUrl: !!faceUrl,
      hasVideoUrl: !!videoUrl,
      name,
      userId,
    });

    if (!faceUrl || !videoUrl) {
      return NextResponse.json(
        { error: 'Both face_url and video_url are required' },
        { status: 400 }
      );
    }

    // Start face swap task
    const response = await fetch('https://video.a2e.ai/api/v1/userFaceSwapTask/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Face Swap',
        face_url: faceUrl,
        video_url: videoUrl,
      }),
    });

    console.log('A2E Face Swap Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Face Swap Response:', responseText.substring(0, 500));

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
    console.log('A2E Face Swap Task ID:', taskId);

    // Poll for completion (max 3 minutes, check every 3 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userFaceSwapTask/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Face swap polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Face swap failed: ' + (statusData.data?.faild_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Face swap timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (10 credits for face swap)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const creditCost = 10;
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
            transaction_type: 'face_swap',
            description: 'Face swap (A2E)',
          });
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Face Swap error:', error);
    return NextResponse.json(
      { error: 'Failed to swap face' },
      { status: 500 }
    );
  }
}
