import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A2E Caption Removal API
 * Remove text/captions from video frames using OCR + inpainting
 */
export async function POST(req: NextRequest) {
  try {
    const { sourceUrl, name, userId } = await req.json();

    console.log('A2E Caption Removal Request:', {
      hasSourceUrl: !!sourceUrl,
      name,
      userId,
    });

    if (!sourceUrl) {
      return NextResponse.json(
        { error: 'source_url is required' },
        { status: 400 }
      );
    }

    // Start caption removal task
    const response = await fetch('https://video.a2e.ai/api/v1/userCaptionRemoval/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Caption Removal',
        source_url: sourceUrl,
      }),
    });

    console.log('A2E Caption Removal Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Caption Removal Response:', responseText.substring(0, 500));

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
    console.log('A2E Caption Removal Task ID:', taskId);

    // Poll for completion (max 5 minutes, check every 5 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userCaptionRemoval/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Caption removal polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Caption removal failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Caption removal timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (8 credits for caption removal)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const creditCost = 8;
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
            transaction_type: 'caption_removal',
            description: 'Caption removal (A2E)',
          });
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Caption Removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove captions' },
      { status: 500 }
    );
  }
}
