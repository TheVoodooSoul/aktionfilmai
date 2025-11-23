import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Delete Custom Background API
 * Delete custom background image from user's library
 */
export async function POST(req: NextRequest) {
  try {
    const { backgroundId } = await req.json();

    console.log('Delete Background Request:', {
      backgroundId,
    });

    if (!backgroundId) {
      return NextResponse.json(
        { error: 'backgroundId (_id from add) is required' },
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

    // Call A2E Delete Background API
    const response = await fetch('https://video.a2e.ai/api/v1/custom_back/del', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        _id: backgroundId,
      }),
    });

    console.log('A2E Delete Background Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Delete Background Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    console.log('Background Deleted:', {
      backgroundId,
    });

    return NextResponse.json({
      success: true,
      message: 'Background deleted successfully',
    });
  } catch (error) {
    console.error('Delete background error:', error);
    return NextResponse.json(
      { error: 'Failed to delete background' },
      { status: 500 }
    );
  }
}
