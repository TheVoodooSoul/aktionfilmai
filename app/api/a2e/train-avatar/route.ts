import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin, supabase as supabaseClient } from '@/lib/supabase';

// Helper to sanitize filename from avatar name
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '')      // Trim leading/trailing dashes
    .substring(0, 50);            // Limit length
}

// Helper to upload base64 to Supabase and get public URL
async function uploadBase64ToStorage(base64Data: string, folder: string, avatarName?: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  if (!base64Data) {
    throw new Error('No base64 data provided to upload');
  }

  // Extract mime type and data
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    console.error('Base64 data format invalid. First 100 chars:', base64Data.substring(0, 100));
    throw new Error('Invalid base64 data format. Expected data:mime;base64,... format');
  }

  const mimeType = matches[1];
  const base64 = matches[2];
  
  if (!base64 || base64.length < 100) {
    throw new Error('Base64 data is too short or empty');
  }

  const buffer = Buffer.from(base64, 'base64');
  
  if (buffer.length === 0) {
    throw new Error('Failed to decode base64 to buffer');
  }

  console.log('Uploading to storage:', { mimeType, bufferSize: buffer.length, folder, avatarName });

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

  // Use avatar name for filename if provided, otherwise random string
  const nameSlug = avatarName ? sanitizeFileName(avatarName) : Math.random().toString(36).substring(7);
  const fileName = `${folder}/${Date.now()}-${nameSlug}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('character-uploads')
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error('Failed to upload file to storage: ' + error.message);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('character-uploads')
    .getPublicUrl(fileName);

  console.log('Upload successful:', publicUrl);
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
      try {
        console.log('Uploading video to storage...');
        videoSource = await uploadBase64ToStorage(videoBase64, `avatars/${userId || 'anonymous'}`, name);
        console.log('Video uploaded:', videoSource);
      } catch (uploadError: any) {
        console.error('Video upload failed:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload video: ' + uploadError.message },
          { status: 500 }
        );
      }
    }

    if (imageBase64) {
      try {
        console.log('Uploading image to storage, base64 length:', imageBase64.length);
        imageSource = await uploadBase64ToStorage(imageBase64, `avatars/${userId || 'anonymous'}`, name);
        console.log('Image uploaded:', imageSource);
      } catch (uploadError: any) {
        console.error('Image upload failed:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload image: ' + uploadError.message },
          { status: 500 }
        );
      }
    }

    if (backgroundImageBase64) {
      try {
        console.log('Uploading background to storage...');
        bgImageSource = await uploadBase64ToStorage(backgroundImageBase64, `backgrounds/${userId || 'anonymous'}`, `${name}-bg`);
        console.log('Background uploaded:', bgImageSource);
      } catch (uploadError: any) {
        console.error('Background upload failed:', uploadError);
        // Non-critical, continue without background
        console.log('Continuing without custom background');
      }
    }

    console.log('Train Avatar Request:', {
      hasVideoSource: !!videoSource,
      hasImageSource: !!imageSource,
      hasVideoBase64: !!videoBase64,
      hasImageBase64: !!imageBase64,
      imageBase64Length: imageBase64?.length || 0,
      name,
      gender,
      hasPrompt: !!prompt,
      hasBackgroundColor: !!backgroundColor,
      hasBgImageSource: !!bgImageSource,
      userId,
    });

    if (!name || !gender) {
      return NextResponse.json(
        { error: 'name and gender (male/female) are required' },
        { status: 400 }
      );
    }

    if (!videoSource && !imageSource) {
      // More helpful error message
      const debugInfo = {
        hadVideoBase64: !!videoBase64,
        hadImageBase64: !!imageBase64,
        hadVideoUrl: !!videoUrl,
        hadImageUrl: !!imageUrl,
      };
      console.error('No image/video source available:', debugInfo);
      return NextResponse.json(
        { error: `No image or video provided. Debug: ${JSON.stringify(debugInfo)}. Please upload an image or video file.` },
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

    // Determine cost: video = 75 credits, image = 150 credits (A2E costs ~$2-5)
    const cost = videoSource ? 75 : 150;

    // Skip credit check for superadmin (real admin account)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001' || userId === 'ce3d0c1d-d7c3-42da-a538-5405ab32cb23';

    if (cost > 0 && userId && !isSuperAdmin) {
      // Check credits (use non-RLS client to avoid auth issues)
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      console.log('Profile check:', { userId, credits: profile?.credits, error: profileError?.message });

      if (!profile || profile.credits < cost) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${cost} credits. You have ${profile?.credits || 0}.` },
          { status: 400 }
        );
      }

      // Deduct credits
      const { error: deductError } = await supabaseClient
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
      // Use 4.5 by default (latest version)
      requestBody.model_version = '4.5';
    }

    console.log('A2E Training Request:', requestBody);

    // Verify image URL is accessible before sending to A2E
    if (imageSource) {
      try {
        const checkResponse = await fetch(imageSource, { method: 'HEAD' });
        console.log('Image URL check:', { url: imageSource, status: checkResponse.status });
        if (!checkResponse.ok) {
          return NextResponse.json(
            { error: `Image URL not accessible (${checkResponse.status}). Storage bucket may not exist. URL: ${imageSource}` },
            { status: 400 }
          );
        }
      } catch (urlError: any) {
        console.error('Image URL check failed:', urlError);
        return NextResponse.json(
          { error: `Cannot verify image URL: ${urlError.message}. URL: ${imageSource}` },
          { status: 400 }
        );
      }
    }

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
      if (cost > 0 && userId && !isSuperAdmin) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabaseClient
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
      if (cost > 0 && userId && !isSuperAdmin) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('credits')
          .eq('id', userId)
          .single();

        if (profile) {
          await supabaseClient
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

    // Save avatar ownership to database (private by default)
    if (avatarId && userId) {
      const { error: saveError } = await supabase
        .from('character_references')
        .upsert({
          avatar_id: avatarId,
          user_id: userId,
          name: name,
          image_url: imageSource || videoSource,
          avatar_status: 'training',
          is_public: false, // Private by default
          generation_type: 'avatar', // Mark as avatar, not scene/storyboard
        }, {
          onConflict: 'avatar_id',
        });

      if (saveError) {
        console.error('Failed to save avatar ownership:', saveError);
        // Don't fail the request, just log the error
      } else {
        console.log('Avatar ownership saved:', { avatarId, userId, name });
      }
    }

    return NextResponse.json({
      avatar_id: avatarId,
      status: 'training',
      cost,
      message: videoSource ? 'Avatar training started (75 credits)' : 'Avatar training started (150 credits)',
    });
  } catch (error) {
    console.error('Train avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to train avatar' },
      { status: 500 }
    );
  }
}
