import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Text-to-Video (Avatar Talking Video)
 * Combines OpenAI TTS + A2E Avatar Video Generation
 */
export async function POST(req: NextRequest) {
  try {
    const { text, avatarId, avatarType, userId } = await req.json();

    console.log('T2V Request:', {
      text: text?.substring(0, 50),
      avatarId,
      avatarType,
      userId,
    });

    if (!text || !avatarId) {
      return NextResponse.json(
        { error: 'text and avatarId are required' },
        { status: 400 }
      );
    }

    // Check and deduct credits BEFORE making expensive API calls
    const creditCost = 75; // OpenAI TTS + A2E avatar video (costs ~$1-2 in API fees)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < creditCost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${creditCost} credits for Text-to-Video.` },
          { status: 402 }
        );
      }

      // Deduct credits upfront
      await supabase
        .from('profiles')
        .update({ credits: profile.credits - creditCost })
        .eq('id', userId);

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -creditCost,
          transaction_type: 'generation',
          description: 'Text to Video (Avatar Talking)',
        });
    }

    // Step 1: Generate voice with OpenAI TTS
    console.log('Generating voice with OpenAI TTS...');
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'onyx', // Can be made configurable
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('OpenAI TTS error:', errorText);
      return NextResponse.json(
        { error: `TTS error: ${ttsResponse.status}` },
        { status: 500 }
      );
    }

    const audioBlob = await ttsResponse.arrayBuffer();

    // Step 2: Upload audio to Supabase storage
    console.log('Uploading audio to Supabase...');
    const audioFileName = `${userId}/${Date.now()}-t2v-audio.mp3`;
    const { data: audioUpload, error: audioUploadError } = await supabase.storage
      .from('character-uploads')
      .upload(audioFileName, audioBlob, {
        contentType: 'audio/mpeg',
      });

    if (audioUploadError) {
      console.error('Audio upload error:', audioUploadError);
      return NextResponse.json(
        { error: 'Failed to upload audio' },
        { status: 500 }
      );
    }

    const { data: { publicUrl: audioUrl } } = supabase.storage
      .from('character-uploads')
      .getPublicUrl(audioFileName);

    console.log('Audio URL:', audioUrl);

    // Step 3: Generate avatar video with A2E
    console.log('Generating avatar video with A2E...');
    const videoResponse = await fetch('https://video.a2e.ai/api/v1/video/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Text to Video',
        anchor_id: avatarId,
        anchor_type: avatarType || 1, // 0 = system, 1 = custom
        audioSrc: audioUrl,
        isSkipRs: true, // Skip smart motion adjustment for speed
        web_bg_width: 0,
        web_bg_height: 0,
        web_people_width: 0,
        web_people_height: 0,
        web_people_x: 0,
        web_people_y: 0,
      }),
    });

    console.log('A2E Video Response status:', videoResponse.status);
    const videoResponseText = await videoResponse.text();
    console.log('A2E Video Response:', videoResponseText.substring(0, 500));

    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${videoResponse.status} - ${videoResponseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const videoData = JSON.parse(videoResponseText);

    if (videoData.code !== 0 || !videoData.data) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (videoData.message || 'Unknown error') },
        { status: 500 }
      );
    }

    const taskId = videoData.data._id;
    console.log('A2E Video Task ID:', taskId);

    // Step 4: Poll for completion (max 10 minutes, check every 5 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes / 5 seconds

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/video/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`T2V polling attempt ${attempts + 1}:`, statusData.data?.status);

      if (statusData.code === 0 && statusData.data?.status === 'done' && statusData.data?.result) {
        resultUrl = statusData.data.result;
        break;
      }

      if (statusData.data?.status === 'fail' || statusData.data?.status === 'failed') {
        return NextResponse.json(
          { error: 'Avatar video generation failed: ' + (statusData.data?.error || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      // Refund credits on timeout
      if (userId && !isSuperAdmin) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();
        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits + creditCost })
            .eq('id', userId);
        }
      }
      return NextResponse.json(
        { error: 'Video generation timed out after 10 minutes. Credits refunded.' },
        { status: 408 }
      );
    }

    return NextResponse.json({
      output_url: resultUrl,
      audio_url: audioUrl,
      status: 'success',
    });
  } catch (error) {
    console.error('T2V error:', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar video' },
      { status: 500 }
    );
  }
}
