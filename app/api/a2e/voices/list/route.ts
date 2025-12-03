import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Voice List API
 * Get available TTS voices from A2E
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'en';
    const region = searchParams.get('region') || 'US';
    const voiceMapType = searchParams.get('voice_map_type') || 'en-US';

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    // Call A2E voice list API
    const response = await fetch(
      `https://video.a2e.ai/api/v1/anchor/voice_list?country=${country}&region=${region}&voice_map_type=${voiceMapType}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('A2E voice list error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get voice list' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Format voices for easier use
    const voices = data.data?.voice_list || [];
    const formattedVoices = voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.label || voice.voice_id,
      gender: voice.gender,
      language: `${voice.country}-${voice.region}`,
      preview_url: voice.preview_url,
      type: 'public',
    }));

    return NextResponse.json({
      voices: formattedVoices,
      total: formattedVoices.length,
      raw: data,
    });
  } catch (error) {
    console.error('Voice list error:', error);
    return NextResponse.json(
      { error: 'Failed to get voices' },
      { status: 500 }
    );
  }
}