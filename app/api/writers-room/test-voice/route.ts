import { NextRequest, NextResponse } from 'next/server';

/**
 * Writers Room - Test Voice Lines
 * Feed lines to character and hear them back with different voices
 */
export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'onyx', characterName } = await req.json();

    console.log('Test voice request:', {
      textLength: text?.length,
      voice,
      characterName,
    });

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      // Return a mock response for testing
      return NextResponse.json({
        audioUrl: null,
        message: 'TTS not configured - text would be spoken as: ' + text,
        voice: voice,
      });
    }

    // Available voices: alloy, echo, fable, onyx, nova, shimmer
    const voiceOptions = {
      'male-deep': 'onyx',
      'male-neutral': 'echo', 
      'female-warm': 'nova',
      'female-energetic': 'shimmer',
      'narrator': 'alloy',
      'mysterious': 'fable',
    };

    const selectedVoice = voiceOptions[voice] || voice;

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // Use tts-1-hd for higher quality
        input: text,
        voice: selectedVoice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate voice' },
        { status: 500 }
      );
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64 for easier handling
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      audioUrl: audioDataUrl,
      voice: selectedVoice,
      characterName,
      message: 'Voice line generated successfully',
    });
  } catch (error) {
    console.error('Test voice error:', error);
    return NextResponse.json(
      { error: 'Failed to test voice' },
      { status: 500 }
    );
  }
}