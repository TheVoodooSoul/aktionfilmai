import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { prompt, characterRefs, sketch, userId } = await req.json();

    console.log('A2E NanoBanana Request:', {
      hasPrompt: !!prompt,
      characterCount: characterRefs?.length || 0,
      hasSketch: !!sketch,
      userId,
    });

    // Build input_images array from character refs and optional sketch
    // Prefer avatar_id if available, otherwise use image_url
    const input_images: string[] = [];
    const avatar_ids: string[] = [];

    if (characterRefs && characterRefs.length > 0) {
      characterRefs.forEach((ref: { image_url: string; avatar_id?: string }) => {
        // If character has a completed avatar, use avatar_id instead of image
        if (ref.avatar_id) {
          avatar_ids.push(ref.avatar_id);
          console.log('Using avatar_id:', ref.avatar_id);
        } else if (ref.image_url) {
          input_images.push(ref.image_url);
          console.log('Using image_url:', ref.image_url.substring(0, 50));
        }
      });
    }

    if (sketch) {
      input_images.push(sketch);
    }

    if (input_images.length === 0 && avatar_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one character reference or sketch is required' },
        { status: 400 }
      );
    }

    // Build request body - use avatar_ids if available, otherwise input_images
    const requestBody: any = {
      name: 'Multi-character action scene',
      prompt: prompt || 'action scene with characters, cinematic lighting, high quality, detailed, 4k',
    };

    // Prefer avatar_ids for better character consistency
    if (avatar_ids.length > 0) {
      requestBody.user_video_twin_ids = avatar_ids; // A2E's parameter for trained avatars
      console.log('Using trained avatars:', avatar_ids);
    }

    // Add input_images if we have any (sketch or non-avatar characters)
    if (input_images.length > 0) {
      requestBody.input_images = input_images;
      console.log('Using input images:', input_images.length);
    }

    // Call A2E NanoBanana API for multi-character scene generation
    const response = await fetch('https://video.a2e.ai/api/v1/userNanoBanana/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('A2E Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Response:', responseText.substring(0, 500));

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
    console.log('A2E Task ID:', taskId);

    // Poll for completion (max 120 seconds, check every 3 seconds)
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 40;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userNanoBanana/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts + 1}:`, statusData.data?.current_status);

      if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.image_urls?.length > 0) {
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

    // Deduct 3 credits from user (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && profile.credits > 0) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - 3 })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -3,
            transaction_type: 'scene',
            description: 'Multi-character scene generation (A2E NanoBanana)',
          });
      }
    }

    return NextResponse.json({
      output_url: imageUrl,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E NanoBanana generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate scene' },
      { status: 500 }
    );
  }
}
