import { NextRequest, NextResponse } from 'next/server';
import { CREDIT_COSTS, checkCredits, deductCredits, refundCredits } from '@/lib/credits';

/**
 * Writers Room - Generate Avatar Performance
 * Takes user's video recording, extracts audio, and generates avatar performance
 */
export async function POST(req: NextRequest) {
  try {
    const { videoUrl, avatarId, characterName, userId } = await req.json();

    console.log('Generate performance request:', {
      hasVideoUrl: !!videoUrl,
      avatarId,
      characterName,
      userId,
    });

    if (!videoUrl || !avatarId) {
      return NextResponse.json(
        { error: 'videoUrl and avatarId are required' },
        { status: 400 }
      );
    }

    // Check and deduct credits
    if (userId) {
      const creditCheck = await checkCredits(userId, CREDIT_COSTS.WRITERS_ROOM_PERFORMANCE);
      if (!creditCheck.success) {
        return NextResponse.json(
          { error: creditCheck.error },
          { status: 402 }  // Payment Required
        );
      }
      
      const deductResult = await deductCredits(
        userId,
        CREDIT_COSTS.WRITERS_ROOM_PERFORMANCE,
        `Writers Room - Avatar Performance for ${characterName}`
      );
      
      if (!deductResult.success) {
        return NextResponse.json(
          { error: 'Failed to process payment' },
          { status: 500 }
        );
      }
    }

    // For now, we'll use A2E's talking video API directly with the video URL
    // A2E should be able to extract audio from the video
    // If not, we'll need to add audio extraction logic

    const response = await fetch('https://video.a2e.ai/api/v1/talkingVideo/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${characterName} - Performance`,
        user_video_twin_id: avatarId,
        audio_url: videoUrl, // A2E should extract audio from video
        // If A2E doesn't support video URLs for audio, we'll need to extract audio separately
      }),
    });

    console.log('A2E Talking Video Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Talking Video Response:', responseText.substring(0, 500));

    if (!response.ok) {
      // Refund credits on failure
      if (userId) {
        await refundCredits(
          userId,
          CREDIT_COSTS.WRITERS_ROOM_PERFORMANCE,
          'Refund - Avatar Performance failed'
        );
      }
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
    console.log('A2E Talking Video Task ID:', taskId);

    // Poll for completion (max 3 minutes, check every 3 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/talkingVideo/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Talking video polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Talking video failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Talking video timed out. Please try again.' },
        { status: 408 }
      );
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      status: 'success',
    });
  } catch (error) {
    console.error('Generate performance error:', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar performance' },
      { status: 500 }
    );
  }
}
