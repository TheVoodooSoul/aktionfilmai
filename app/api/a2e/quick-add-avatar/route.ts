import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Quick Add Avatar API
 * Converts generated image (from text2image) to avatar instantly
 * This is A2E's native workflow for T2I -> Avatar
 */
export async function POST(req: NextRequest) {
  try {
    const { taskId, name, gender, userId } = await req.json();

    console.log('Quick Add Avatar Request:', {
      taskId,
      name,
      gender,
      userId,
    });

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId (from text2image) is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    // Call A2E quickAddAvatar endpoint
    const response = await fetch('https://video.a2e.ai/api/v1/userText2image/quickAddAvatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: taskId,
      }),
    });

    console.log('A2E Quick Add Avatar Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Quick Add Avatar Response:', responseText.substring(0, 500));

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

    console.log('Quick Add Avatar Success:', data);

    return NextResponse.json({
      avatar_id: data.data?._id || data.data,
      status: 'success',
      message: 'Avatar created from generated image!',
    });
  } catch (error) {
    console.error('Quick add avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to quick add avatar' },
      { status: 500 }
    );
  }
}
