import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Text-to-Speech API
 * Generate audio from text using A2E voices or custom clones
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      text, 
      voice_id,           // Public voice ID
      user_voice_id,      // Custom clone speaker_id
      country = 'en',
      region = 'US',
      speed = 1.0,
      pitch = 0,
      volume = 0,
    } = await req.json();

    console.log('A2E TTS request:', {
      textLength: text?.length,
      voice_id,
      user_voice_id,
      language: `${country}-${region}`,
    });

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
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

    // Build request body
    const requestBody: any = {
      text,
      speed,
      pitch,
      volume,
    };

    // Use custom clone if provided, otherwise use public voice
    if (user_voice_id) {
      requestBody.user_voice_id = user_voice_id;
      requestBody.country = country;
      requestBody.region = region;
    } else if (voice_id) {
      requestBody.voice_id = voice_id;
    } else {
      // Default voice if none specified
      requestBody.voice_id = 'en-US-JennyNeural';
    }

    // Call A2E TTS API
    const response = await fetch('https://video.a2e.ai/api/v1/video/send_tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('A2E TTS error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json(
        { error: data.message || 'TTS generation failed' },
        { status: 500 }
      );
    }

    const audioUrl = data.data?.audio_url;
    const taskId = data.data?._id;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'No audio URL returned' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audio_url: audioUrl,
      task_id: taskId,
      voice_used: user_voice_id ? 'custom_clone' : 'public',
      status: 'success',
    });
  } catch (error) {
    console.error('A2E TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}