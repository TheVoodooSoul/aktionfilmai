import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Completed Voice Clones API
 * Get list of trained voice clones
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

    // Call A2E completed voice records API
    const response = await fetch('https://video.a2e.ai/api/v1/userVoice/completedRecord', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('A2E voice clones error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get voice clones' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Format voice clones for easier use
    const clones = data.data || [];
    const formattedClones = clones.map((clone: any) => ({
      id: clone._id,
      speaker_id: clone.speaker_id, // Use this for TTS
      name: clone.name,
      description: clone.description,
      model: clone.model || 'a2e',
      status: clone.status,
      created_at: clone.created_at,
      type: 'clone',
    }));

    return NextResponse.json({
      voiceClones: formattedClones,
      total: formattedClones.length,
      raw: data,
    });
  } catch (error) {
    console.error('Voice clones error:', error);
    return NextResponse.json(
      { error: 'Failed to get voice clones' },
      { status: 500 }
    );
  }
}