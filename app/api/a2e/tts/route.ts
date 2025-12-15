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

    // Build request body - A2E uses 'msg' and 'speechRate' (required)
    const requestBody: any = {
      msg: text,
      speechRate: speed, // A2E uses speechRate, not speed
    };

    // Use custom clone if provided, otherwise use public voice
    // A2E uses 'tts_id' for public voices and 'user_voice_id' for clones
    if (user_voice_id) {
      requestBody.user_voice_id = user_voice_id;
      requestBody.country = country;
      requestBody.region = region;
    } else if (voice_id) {
      requestBody.tts_id = voice_id; // A2E uses tts_id, not voice_id
    } else {
      // Default voice if none specified
      requestBody.tts_id = 'en-US-JennyNeural';
    }

    console.log('A2E TTS request body:', JSON.stringify(requestBody, null, 2));

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
    console.log('A2E TTS response:', JSON.stringify(data, null, 2));

    if (data.code !== 0) {
      return NextResponse.json(
        { error: data.message || data.msg || 'TTS generation failed' },
        { status: 500 }
      );
    }

    // A2E returns audio URL directly in data as a string, or as data.audio_url
    const audioUrl = typeof data.data === 'string' ? data.data : data.data?.audio_url;
    const taskId = typeof data.data === 'object' ? data.data?._id : null;

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