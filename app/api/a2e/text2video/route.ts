import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Text-to-Video (A2E)
 * Generate video directly from text prompt
 * Supports @name tags for character references
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, negativePrompt, userId } = await req.json();

    console.log('A2E Text2Video Request:', {
      prompt: prompt?.substring(0, 100),
      userId,
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call A2E Text-to-Video API
    const response = await fetch('https://video.a2e.ai/api/v1/userText2Video/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Text to Video',
        prompt: prompt,
        negative_prompt: negativePrompt || 'blurry, low quality, distorted, deformed',
      }),
    });

    console.log('A2E Text2Video Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Text2Video Response:', responseText.substring(0, 500));

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
    console.log('A2E Text2Video Task ID:', taskId);

    // Poll for completion (max 15 minutes, check every 5 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 180;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userText2Video/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Text2Video polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Text-to-Video generation failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Video generation timed out after 15 minutes. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits
    const creditCost = 80;
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
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
            transaction_type: 'generation',
            description: 'Text to Video (A2E)',
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
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Text2Video error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}
