import { NextRequest, NextResponse } from 'next/server';
import { CREDIT_COSTS, checkCredits, deductCredits } from '@/lib/credits';

/**
 * Writers Room - Generate AI Character Image
 * Creates a visual representation of the AI role for improvisation
 */
export async function POST(req: NextRequest) {
  try {
    const { characterName, characterDescription, userId } = await req.json();

    console.log('Generate character request:', {
      characterName,
      characterDescription,
      userId,
    });

    if (!characterName || !characterDescription) {
      return NextResponse.json(
        { error: 'Character name and description are required' },
        { status: 400 }
      );
    }

    // Check and deduct credits
    const creditCost = 5; // Character generation for Writers Room
    if (userId) {
      const creditCheck = await checkCredits(userId, creditCost);
      if (!creditCheck.success) {
        return NextResponse.json(
          { error: creditCheck.error },
          { status: 402 }
        );
      }

      const deductResult = await deductCredits(
        userId,
        creditCost,
        `Writers Room - Generate character image for ${characterName}`
      );

      if (!deductResult.success) {
        return NextResponse.json(
          { error: 'Failed to process payment' },
          { status: 500 }
        );
      }
    }

    // Build prompt for character generation
    const prompt = `${characterDescription}, cinematic portrait, action hero style, detailed face, professional photography, high quality`;

    // Call A2E text-to-image API
    const response = await fetch('https://video.a2e.ai/api/v1/userText2image/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Writers Room - ${characterName}`,
        prompt: prompt,
        req_key: 'high_aes_general_v21_L',
        width: 1024,
        height: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('A2E character generation error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate character image' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.code !== 0 || !data.data || !data.data[0]) {
      return NextResponse.json(
        { error: 'Failed to generate character' },
        { status: 500 }
      );
    }

    const taskId = data.data[0]._id;

    // Poll for completion
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userText2image/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();

      if ((statusData.data?.current_status === 'done' || statusData.data?.current_status === 'completed') 
          && statusData.data?.image_urls?.length > 0) {
        imageUrl = statusData.data.image_urls[0];
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Character generation failed' },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Generation timed out' },
        { status: 408 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      characterName,
      message: 'Character image generated successfully',
    });
  } catch (error) {
    console.error('Generate character error:', error);
    return NextResponse.json(
      { error: 'Failed to generate character' },
      { status: 500 }
    );
  }
}