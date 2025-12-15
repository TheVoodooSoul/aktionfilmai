import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

// Helper to upload base64 to Supabase and get public URL
async function uploadBase64ToStorage(base64Data: string, folder: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  // Extract mime type and data
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data');
  }

  const mimeType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, 'base64');

  // Determine file extension
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  const ext = extMap[mimeType] || 'bin';

  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('character-uploads')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload file: ' + error.message);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('character-uploads')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * A2E Avatar Training API
 * Train avatar from video (10 credits) or image (30 credits)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      videoUrl,
      videoBase64,
      imageUrl,
      imageBase64,
      name,
      gender,
      prompt,
      negativePrompt,
      backgroundColor,
      backgroundImage,
      backgroundImageBase64,
      userId
    } = await req.json();

    // Upload base64 to storage if provided, otherwise use URL
    let videoSource = videoUrl;
    let imageSource = imageUrl;
    let bgImageSource = backgroundImage;

    if (videoBase64) {
      console.log('Uploading video to storage...');
      videoSource = await uploadBase64ToStorage(videoBase64, `avatars/${userId || 'anonymous'}`);
      console.log('Video uploaded:', videoSource);
    }

    if (imageBase64) {
      console.log('Uploading image to storage...');
      imageSource = await uploadBase64ToStorage(imageBase64, `avatars/${userId || 'anonymous'}`);
      console.log('Image uploaded:', imageSource);
    }

    if (backgroundImageBase64) {
      console.log('Uploading background to storage...');
      bgImageSource = await uploadBase64ToStorage(backgroundImageBase64, `backgrounds/${userId || 'anonymous'}`);
      console.log('Background uploaded:', bgImageSource);
    }

    console.log('Train Avatar Request:', {
      hasVideoSource: !!videoSource,
      hasImageSource: !!imageSource,
      name,
      gender,
      hasPrompt: !!prompt,
      hasBackgroundColor: !!backgroundColor,
      hasBgImageSource: !!bgImageSource,
      userId,
    });

    if (!name || !gender || (!videoSource && !imageSource)) {
      return NextResponse.json(
        { error: 'name, gender (male/female), and either video or image are required' },
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
    const cost = videoSource ? 10 : 30;

    // Skip credit check for superadmin
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (cost > 0 && userId && !isSuperAdmin) {
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

    if (videoSource) {
      requestBody.video_url = videoSource;
      // Video-specific options
      if (backgroundColor) {
        requestBody.video_backgroud_color = backgroundColor; // Note: A2E typo "backgroud"
      }
      if (bgImageSource) {
        requestBody.video_backgroud_image = bgImageSource;
      }
    } else if (imageSource) {
      requestBody.image_url = imageSource;
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
      type: videoSource ? 'video' : 'image',
    });

    return NextResponse.json({
      avatar_id: avatarId,
      status: 'training',
      cost,
      message: videoSource ? 'Avatar training started (10 credits)' : 'Avatar training started (30 credits)',
    });
  } catch (error) {
    console.error('Train avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to train avatar' },
      { status: 500 }
    );
  }
}
