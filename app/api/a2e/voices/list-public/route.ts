import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E List Public TTS Voices API
 * Returns available TTS voices (male/female)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
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

    let url = `https://video.a2e.ai/api/v1/anchor/voice_list?country=${country}&region=${region}&voice_map_type=${voiceMapType}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-lang': 'en-US',
      },
    });

    const responseText = await response.text();
    console.log('A2E List Voices Response:', responseText.substring(0, 500));

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

    // Extract male and female voices
    const voiceData = data.data || [];
    const femaleVoices = voiceData.find((g: any) => g.value === 'female')?.children || [];
    const maleVoices = voiceData.find((g: any) => g.value === 'male')?.children || [];

    return NextResponse.json({
      voices: voiceData,
      female: femaleVoices,
      male: maleVoices,
      totalCount: femaleVoices.length + maleVoices.length,
    });
  } catch (error) {
    console.error('List public voices error:', error);
    return NextResponse.json(
      { error: 'Failed to list public voices' },
      { status: 500 }
    );
  }
}
