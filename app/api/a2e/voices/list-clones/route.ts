import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E List Voice Clones API
 * Returns user's custom trained voice clones
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://video.a2e.ai/api/v1/userVoice/completedRecord', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-lang': 'en-US',
      },
    });

    const responseText = await response.text();
    console.log('A2E List Voice Clones Response:', responseText.substring(0, 500));

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

    // Filter only completed voice clones
    const voiceClones = (data.data || []).filter(
      (voice: any) => voice.current_status === 'completed'
    );

    return NextResponse.json({
      voiceClones: voiceClones,
      totalCount: voiceClones.length,
    });
  } catch (error) {
    console.error('List voice clones error:', error);
    return NextResponse.json(
      { error: 'Failed to list voice clones' },
      { status: 500 }
    );
  }
}
