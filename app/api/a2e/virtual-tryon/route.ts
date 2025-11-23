import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A2E Virtual Try-On API
 * Change character clothing/costumes using AI
 */
export async function POST(req: NextRequest) {
  try {
    const { imageUrls, name, userId } = await req.json();

    console.log('A2E Virtual Try-On Request:', {
      imageUrlsCount: imageUrls?.length,
      name,
      userId,
    });

    if (!imageUrls || imageUrls.length !== 4) {
      return NextResponse.json(
        { error: 'Exactly 4 image URLs required: [person, person_mask, clothing, clothing_mask]' },
        { status: 400 }
      );
    }

    // Start virtual try-on task
    const response = await fetch('https://video.a2e.ai/api/v1/virtualTryOn/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Virtual Try-On',
        image_urls: imageUrls,
      }),
    });

    console.log('A2E Virtual Try-On Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Virtual Try-On Response:', responseText.substring(0, 500));

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
    console.log('A2E Virtual Try-On Task ID:', taskId);

    // Poll for completion (max 3 minutes, check every 3 seconds)
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts && !resultUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/virtualTryOn/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Virtual try-on polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
        resultUrl = statusData.data.result_url;
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Virtual try-on failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Virtual try-on timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (10 credits for virtual try-on)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const creditCost = 10;
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
            transaction_type: 'virtual_tryon',
            description: 'Virtual try-on (A2E)',
          });
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Virtual Try-On error:', error);
    return NextResponse.json(
      { error: 'Failed to perform virtual try-on' },
      { status: 500 }
    );
  }
}
