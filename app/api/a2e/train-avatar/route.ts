import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * A2E Avatar Training API
 * Train avatar from video (FREE) or image (30 credits)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      videoUrl,
      imageUrl,
      name,
      gender,
      prompt,
      negativePrompt,
      backgroundColor,
      backgroundImage,
      userId
    } = await req.json();

    console.log('Train Avatar Request:', {
      hasVideoUrl: !!videoUrl,
      hasImageUrl: !!imageUrl,
      name,
      gender,
      hasPrompt: !!prompt,
      hasBackgroundColor: !!backgroundColor,
      hasBackgroundImage: !!backgroundImage,
      userId,
    });

    if (!name || !gender || (!videoUrl && !imageUrl)) {
      return NextResponse.json(
        { error: 'name, gender (male/female), and either videoUrl or imageUrl are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Determine cost: video = 10 credits, image = 30 credits
    const cost = videoUrl ? 10 : 30;

    if (cost > 0 && userId) {
      // Check credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < cost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${cost} credits.` },
          { status: 400 }
        );
      }

      // Deduct credits
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - cost })
        .eq('id', userId);

      if (deductError) {
        console.error('Failed to deduct credits:', deductError);
        return NextResponse.json(
          { error: 'Failed to deduct credits' },
          { status: 500 }
        );
      }
    }

    // Call A2E Avatar Training API
    const requestBody: any = {
      name: name,
      gender: gender, // Required: 'male' or 'female'
    };

    if (videoUrl) {
      requestBody.video_url = videoUrl;
      // Video-specific options
      if (backgroundColor) {
        requestBody.video_backgroud_color = backgroundColor; // Note: A2E typo "backgroud"
      }
      if (backgroundImage) {
        requestBody.video_backgroud_image = backgroundImage;
      }
    } else if (imageUrl) {
      requestBody.image_url = imageUrl;
      // Image-specific options
      if (prompt) {
        requestBody.prompt = prompt;
      }
      if (negativePrompt) {
        requestBody.negative_prompt = negativePrompt;
      }
      // Use V2.1 by default (best quality)
      requestBody.model_version = 'V2.1';
    }

    console.log('A2E Training Request:', requestBody);

    const response = await fetch('https://video.a2e.ai/api/v1/userVideoTwin/startTraining', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('A2E Training Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Training Response:', responseText.substring(0, 500));

    if (!response.ok) {
      // Refund credits on failure
      if (cost > 0 && userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits + cost })
            .eq('id', userId);
        }
      }

      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0) {
      // Refund credits on API error
      if (cost > 0 && userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ credits: profile.credits + cost })
            .eq('id', userId);
        }
      }

      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    // Extract avatar ID from response
    // A2E returns array with avatar data
    const avatarId = data.data?.[0]?._id || data.data?._id;

    console.log('Avatar Training Started:', {
      avatarId,
      cost,
      type: videoUrl ? 'video' : 'image',
    });

    return NextResponse.json({
      avatar_id: avatarId,
      status: 'training',
      cost,
      message: videoUrl ? 'Avatar training started (FREE)' : 'Avatar training started (30 credits)',
    });
  } catch (error) {
    console.error('Train avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to train avatar' },
      { status: 500 }
    );
  }
}
