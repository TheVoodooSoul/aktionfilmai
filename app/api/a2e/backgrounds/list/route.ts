import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E List Background Images API
 * Returns user uploaded and system provided background images
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://video.a2e.ai/api/v1/custom_back/allBackground', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
    });

    const responseText = await response.text();
    console.log('A2E List Backgrounds Response:', responseText.substring(0, 500));

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

    // Separate custom and default backgrounds
    const backgrounds = data.data || [];
    const customBackgrounds = backgrounds.filter((bg: any) => bg.type === 'custom');
    const defaultBackgrounds = backgrounds.filter((bg: any) => bg.type === 'default');

    return NextResponse.json({
      backgrounds: backgrounds,
      custom: customBackgrounds,
      default: defaultBackgrounds,
    });
  } catch (error) {
    console.error('List backgrounds error:', error);
    return NextResponse.json(
      { error: 'Failed to list backgrounds' },
      { status: 500 }
    );
  }
}
