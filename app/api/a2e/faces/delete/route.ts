import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Delete Face Swap Image API
 * Delete face image from user's library
 */
export async function DELETE(req: NextRequest) {
  try {
    const { faceId } = await req.json();

    console.log('Delete Face Request:', {
      faceId,
    });

    if (!faceId) {
      return NextResponse.json(
        { error: 'faceId (_id from add) is required' },
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

    // Call A2E Delete Face Swap Image API
    const response = await fetch(`https://video.a2e.ai/api/v1/userFaceSwapImage/${faceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
    });

    console.log('A2E Delete Face Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Delete Face Response:', responseText.substring(0, 500));

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

    console.log('Face Deleted:', {
      faceId,
    });

    return NextResponse.json({
      success: true,
      message: 'Face deleted successfully',
    });
  } catch (error) {
    console.error('Delete face error:', error);
    return NextResponse.json(
      { error: 'Failed to delete face image' },
      { status: 500 }
    );
  }
}
