import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A2E Dubbing/Translation API
 * Translate video/audio to another language with voice cloning
 */
export async function POST(req: NextRequest) {
  try {
    const {
      sourceUrl,
      sourceLang,
      targetLang,
      numSpeakers,
      dropBackgroundAudio,
      name,
      userId
    } = await req.json();

    console.log('A2E Dubbing Request:', {
      hasSourceUrl: !!sourceUrl,
      sourceLang,
      targetLang,
      numSpeakers,
      userId,
    });

    if (!sourceUrl || !targetLang) {
      return NextResponse.json(
        { error: 'source_url and target_lang are required' },
        { status: 400 }
      );
    }

    // Start dubbing task
    const response = await fetch('https://video.a2e.ai/api/v1/userDubbing/startDubbing', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Dubbing Task',
        source_url: sourceUrl,
        source_lang: sourceLang || 'auto', // Auto-detect source language
        target_lang: targetLang,
        num_speakers: numSpeakers || 1,
        drop_background_audio: dropBackgroundAudio || false,
      }),
    });

    console.log('A2E Dubbing Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Dubbing Response:', responseText.substring(0, 500));

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

    const taskId = data.data._id;
    console.log('A2E Dubbing Task ID:', taskId);

    // Poll for completion (max 5 minutes for dubbing, check every 5 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userDubbing/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Dubbing polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Dubbing failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Dubbing timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (15 credits for dubbing)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const creditCost = 15;
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
            transaction_type: 'dubbing',
            description: `Dubbing (${sourceLang} → ${targetLang})`,
          });
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Dubbing error:', error);
    return NextResponse.json(
      { error: 'Failed to create dubbing' },
      { status: 500 }
    );
  }
}
