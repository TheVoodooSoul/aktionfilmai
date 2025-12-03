import { NextRequest, NextResponse } from 'next/server';
import { CREDIT_COSTS, checkCredits, deductCredits, refundCredits } from '@/lib/credits';

/**
 * A2E Voice Clone Training API
 * Train custom TTS voice from audio sample
 */
export async function POST(req: NextRequest) {
  try {
    const { 
      audioUrl, 
      name, 
      description,
      model = 'a2e', // a2e, cartesia, minimax, elevenlabs
      userId 
    } = await req.json();

    console.log('Voice clone request:', {
      audioUrl,
      name,
      model,
      userId,
    });

    if (!audioUrl || !name) {
      return NextResponse.json(
        { error: 'audioUrl and name are required' },
        { status: 400 }
      );
    }

    // Check and deduct credits (voice cloning costs 10 credits)
    const creditCost = 10;
    if (userId) {
      const creditCheck = await checkCredits(userId, creditCost);
      if (!creditCheck.success) {
        return NextResponse.json(
          { error: creditCheck.error },
          { status: 402 }
        );
      }

      const deductResult = await deductCredits(
        userId,
        creditCost,
        `Voice clone training - ${name}`
      );

      if (!deductResult.success) {
        return NextResponse.json(
          { error: 'Failed to process payment' },
          { status: 500 }
        );
      }
    }

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      // Refund credits if API key missing
      if (userId) {
        await refundCredits(userId, creditCost, 'Refund - API configuration error');
      }
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    // Call A2E voice training API
    const response = await fetch('https://video.a2e.ai/api/v1/userVoice/training', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        audio_url: audioUrl,
        description: description,
        model: model, // Model selection: a2e, cartesia, minimax, elevenlabs
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('A2E voice training error:', errorText);
      
      // Refund credits on failure
      if (userId) {
        await refundCredits(userId, creditCost, 'Refund - Voice training failed');
      }
      
      return NextResponse.json(
        { error: 'Failed to start voice training' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.code !== 0) {
      // Refund credits on API error
      if (userId) {
        await refundCredits(userId, creditCost, 'Refund - Voice training error');
      }
      
      return NextResponse.json(
        { error: data.message || 'Voice training failed' },
        { status: 500 }
      );
    }

    const voiceId = data.data?._id || data.data?.speaker_id;

    console.log('Voice training started:', {
      voiceId,
      name,
      model,
    });

    return NextResponse.json({
      voice_id: voiceId,
      speaker_id: voiceId, // For TTS usage
      status: 'training',
      message: 'Voice clone training started (usually completes in 1 minute)',
      cost: creditCost,
    });
  } catch (error) {
    console.error('Voice clone error:', error);
    return NextResponse.json(
      { error: 'Failed to train voice clone' },
      { status: 500 }
    );
  }
}