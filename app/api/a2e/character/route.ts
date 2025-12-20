import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { prompt, referenceImage, userId, waitForAvatar, uploadedImage, uploadedVideo } = await req.json();

    console.log('A2E Request:', {
      url: 'https://video.a2e.ai/api/v1/userText2image/start',
      hasKey: !!process.env.A2E_API_KEY,
      prompt,
      hasImage: !!referenceImage,
      hasUploadedImage: !!uploadedImage,
      hasUploadedVideo: !!uploadedVideo,
    });

    // If user uploaded image/video, just return it - don't auto-train avatar
    // Let the user decide to train it on the Characters page instead
    if (uploadedImage || uploadedVideo) {
      const imageUrl = uploadedImage || uploadedVideo;
      console.log('User uploaded file, returning without auto-training:', imageUrl);

      return NextResponse.json({
        output_url: imageUrl,
        status: 'success',
        message: 'Image uploaded successfully. Go to Characters page to train as avatar.',
      });
    }

    // Call A2E.AI text-to-image API for character generation
    const response = await fetch('https://video.a2e.ai/api/v1/userText2image/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Character Generation',
        prompt: prompt,
        req_key: 'high_aes_general_v21_L', // High aesthetic quality
        width: 1024,
        height: 1024,
      }),
    });

    console.log('A2E Response status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('A2E Response body:', responseText.substring(0, 500));

    // Check if response is HTML (documentation page) instead of JSON
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('A2E API returned HTML instead of JSON. The endpoint may be incorrect.');
      return NextResponse.json(
        {
          error: 'A2E API endpoint is incorrect. Please check the A2E.AI documentation for the correct endpoint URL. For now, please upload character images instead of generating them.'
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E.AI API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);

    // Check if request was successful
    if (data.code !== 0 || !data.data || !data.data[0]) {
      return NextResponse.json(
        { error: 'A2E API returned an error' },
        { status: 500 }
      );
    }

    const taskId = data.data[0]._id;
    console.log('A2E Task ID:', taskId);

    // Poll for completion (max 60 seconds, check every 2 seconds)
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userText2image/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if ((statusData.data?.current_status === 'done' || statusData.data?.current_status === 'completed') && statusData.data?.image_urls?.length > 0) {
        imageUrl = statusData.data.image_urls[0];
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'A2E generation failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Generation timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const creditCost = 2;
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
            description: 'Character generation (A2E.AI)',
          });
      }
    }

    // Don't auto-train avatar from scene generations - this was creating junk avatars
    // Users can manually train avatars from the Characters page
    return NextResponse.json({
      output_url: imageUrl,
      task_id: taskId,
      status: 'success',
      message: 'Character image generated. Go to Characters page to train as avatar if needed.',
    });
  } catch (error) {
    console.error('A2E character generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate character' },
      { status: 500 }
    );
  }
}
