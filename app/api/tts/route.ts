import { NextRequest, NextResponse } from 'next/server';

/**
 * Text-to-Speech API using OpenAI
 * Generates audio from text with character voices
 */
export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'alloy', model = 'tts-1' } = await req.json();

    console.log('TTS Request:', {
      textLength: text?.length,
      voice,
      model,
    });

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model, // 'tts-1' or 'tts-1-hd'
        input: text,
        voice, // alloy, echo, fable, onyx, nova, shimmer
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', errorText);
      return NextResponse.json(
        { error: `OpenAI TTS error: ${response.status}` },
        { status: 500 }
      );
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();

    // Return audio as MP3
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
