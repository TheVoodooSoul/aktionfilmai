import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A2E Lipsync API (Talking Photo)
 * Animate static photos with audio/speech for lip-sync
 * Uses the correct A2E talkingPhoto endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const { image, imageUrl, avatarId, audio, audioUrl, text, userId } = await req.json();

    console.log('A2E Lipsync Request:', {
      hasImage: !!image,
      hasImageUrl: !!imageUrl,
      hasAvatarId: !!avatarId,
      hasAudio: !!audio,
      hasAudioUrl: !!audioUrl,
      hasText: !!text,
      userId,
    });

    // Determine the image source
    const finalImageUrl = imageUrl || image;
    const finalAudioUrl = audioUrl || audio;

    if (!finalImageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required for lipsync' },
        { status: 400 }
      );
    }

    if (!finalAudioUrl && !text) {
      return NextResponse.json(
        { error: 'Either audio URL or text for TTS is required' },
        { status: 400 }
      );
    }

    // If text is provided but no audio, generate TTS first
    let audioSource = finalAudioUrl;
    if (!audioSource && text) {
      console.log('Generating TTS for lipsync...');
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'onyx',
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

      // Upload to Supabase storage
      const audioFileName = `${userId || 'anonymous'}/${Date.now()}-lipsync-audio.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('character-uploads')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/mpeg',
        });

      if (uploadError) {
        console.error('Audio upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload TTS audio' },
          { status: 500 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(audioFileName);

      audioSource = publicUrl;
      console.log('TTS audio uploaded:', audioSource);
    }

    // Call A2E talkingPhoto API (correct endpoint)
    const response = await fetch('https://video.a2e.ai/api/v1/talkingPhoto/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Lipsync',
        image_url: finalImageUrl,
        audio_url: audioSource,
        duration: 3,
        prompt: 'speaking, looking at the camera, detailed eyes, clear teeth, static view point, still background, elegant, clear facial features, stable camera',
        negative_prompt: 'blurry, distorted, low quality, flickering, static, motionless',
      }),
    });

    console.log('A2E Lipsync Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Lipsync Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0 || !data.data) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    const taskId = data.data._id;
    console.log('A2E Lipsync Task ID:', taskId);

    // Poll for completion (max 2 minutes, check every 3 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 40;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/talkingPhoto/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Lipsync polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Lipsync failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Lipsync timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (5 credits for lipsync)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const creditCost = 5;
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && profile.credits >= creditCost) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - creditCost })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -creditCost,
            transaction_type: 'lipsync',
            description: 'Lipsync generation (A2E)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E lipsync error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lipsync video' },
      { status: 500 }
    );
  }
}
