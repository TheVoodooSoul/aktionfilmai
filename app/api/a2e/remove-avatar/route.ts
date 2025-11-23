import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Remove Avatar API
 * Delete a custom avatar created by the user
 */
export async function POST(req: NextRequest) {
  try {
    const { avatarId } = await req.json();

    console.log('Remove Avatar Request:', {
      avatarId,
    });

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatarId (_id from startTraining) is required' },
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

    // Call A2E Remove Avatar API
    const response = await fetch('https://video.a2e.ai/api/v1/userVideoTwin/remove', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        _id: avatarId,
      }),
    });

    console.log('A2E Remove Avatar Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Remove Avatar Response:', responseText.substring(0, 500));

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

    console.log('Avatar Removed Successfully:', {
      avatarId,
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    console.error('Remove avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    );
  }
}
