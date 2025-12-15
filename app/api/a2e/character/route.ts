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

    // If user uploaded image/video, skip text-to-image and go straight to avatar training
    if (uploadedImage || uploadedVideo) {
      const imageUrl = uploadedImage || uploadedVideo; // Use uploaded file

      // Skip to avatar training
      console.log('Using uploaded file for avatar training:', imageUrl);

      // Jump to avatar training section
      const avatarResponse = await fetch('https://video.a2e.ai/api/v1/userVideoTwin/startTraining', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
          'Content-Type': 'application/json',
          'x-lang': 'en-US',
        },
        body: JSON.stringify({
          name: `Avatar - ${prompt.substring(0, 50) || 'Uploaded'}`,
          gender: 'male', // TODO: detect gender
          ...(uploadedVideo ? { video_url: uploadedVideo } : { image_url: uploadedImage }),
          prompt: prompt || 'action character',
          negative_prompt: 'blurry, distorted, low quality',
          model_version: '4.5',
          skipPreview: false,
        }),
      });

      if (!avatarResponse.ok) {
        return NextResponse.json({
          error: 'Avatar training failed',
          status: 'error',
        }, { status: 500 });
      }

      const avatarData = await avatarResponse.json();
      const avatarId = avatarData.data?._id;

      // Deduct credits for avatar training
      // Video avatar = 10 credits, Image avatar = 30 credits
      if (userId) {
        const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';
        if (!isSuperAdmin) {
          const creditCost = uploadedVideo ? 10 : 30; // Video = 10, Image = 30
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
                transaction_type: 'avatar',
                description: 'Image avatar training (A2E)',
              });
          }
        }
      }

      return NextResponse.json({
        output_url: imageUrl,
        avatar_id: avatarId,
        avatar_status: 'training',
        status: 'success',
        message: uploadedVideo
          ? 'Video avatar training started (10 credits)'
          : 'Image avatar training started (30 credits)',
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

    // Now train avatar from the generated image using correct A2E endpoint
    console.log('Training avatar from generated image:', imageUrl);

    const avatarResponse = await fetch('https://video.a2e.ai/api/v1/userVideoTwin/startTraining', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        name: `Avatar - ${prompt.substring(0, 50)}`,
        gender: 'male', // TODO: detect gender from prompt
        image_url: imageUrl,
        prompt: prompt,
        negative_prompt: 'blurry, distorted, low quality',
        model_version: '4.5', // More flexible, high motion, supports wide content
        skipPreview: false, // Set true for "Continue Training" (100 credits, 30min, better lipsync)
      }),
    });

    if (!avatarResponse.ok) {
      console.error('Avatar training failed:', avatarResponse.status);
      // Return image anyway, avatar training is optional
      return NextResponse.json({
        output_url: imageUrl,
        status: 'success',
        warning: 'Avatar training failed, image generated successfully',
      });
    }

    const avatarData = await avatarResponse.json();
    console.log('Avatar training started:', avatarData);

    const avatarId = avatarData.data?._id;

    // If waitForAvatar is true, poll for completion (max 5 minutes)
    if (waitForAvatar && avatarId) {
      console.log('Polling for avatar completion...');
      let avatarStatus = 'training';
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes (5s intervals)

      while (attempts < maxAttempts && avatarStatus === 'training') {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userVideoTwin/${avatarId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
            'x-lang': 'en-US',
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const status = statusData.data?.status;

          console.log(`Avatar polling attempt ${attempts + 1}: ${status}`);

          if (status === 'completed' || status === 'done') {
            avatarStatus = 'completed';
            break;
          }

          if (status === 'failed' || status === 'error') {
            avatarStatus = 'failed';
            break;
          }
        }

        attempts++;
      }

      return NextResponse.json({
        output_url: imageUrl,
        avatar_id: avatarId,
        avatar_status: avatarStatus,
        status: 'success',
        message: avatarStatus === 'completed'
          ? 'Character generated and avatar training completed'
          : avatarStatus === 'failed'
          ? 'Character generated but avatar training failed'
          : 'Character generated, avatar training in progress (timed out)',
      });
    }

    return NextResponse.json({
      output_url: imageUrl,
      avatar_id: avatarId,
      avatar_status: 'training',
      status: 'success',
      message: avatarId ? 'Character generated and avatar training started' : 'Character generated',
    });
  } catch (error) {
    console.error('A2E character generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate character' },
      { status: 500 }
    );
  }
}
