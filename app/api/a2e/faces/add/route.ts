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
 * A2E Add Face Swap Image API
 * Add face image to user's library for face swapping
 */
export async function POST(req: NextRequest) {
  try {
    const { faceUrl, faceBase64, userId } = await req.json();

    console.log('Add Face Image Request:', {
      hasFaceUrl: !!faceUrl,
      hasFaceBase64: !!faceBase64,
      userId,
    });

    if (!faceUrl && !faceBase64) {
      return NextResponse.json(
        { error: 'faceUrl or faceBase64 is required' },
        { status: 400 }
      );
    }

    // Upload base64 to storage if provided, otherwise use URL
    let imageToUpload = faceUrl;
    if (faceBase64) {
      console.log('Uploading face image to storage...');
      imageToUpload = await uploadBase64ToStorage(faceBase64, `faces/${userId || 'anonymous'}`);
      console.log('Face image uploaded:', imageToUpload);
    }

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Cost for adding face (assuming 3 credits)
    const cost = 3;

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
          { error: `Insufficient credits. Need ${cost} credits to add face image.` },
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

    // Call A2E Add Face Swap Image API
    const response = await fetch('https://video.a2e.ai/api/v1/userFaceSwapImage/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        face_url: imageToUpload,
      }),
    });

    console.log('A2E Add Face Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Add Face Response:', responseText.substring(0, 500));

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

    console.log('Face Image Added:', {
      faceId: data.data?.[0]?._id,
      cost,
    });

    return NextResponse.json({
      success: true,
      faces: data.data,
      cost,
      message: 'Face added to library',
    });
  } catch (error) {
    console.error('Add face error:', error);
    return NextResponse.json(
      { error: 'Failed to add face image' },
      { status: 500 }
    );
  }
}
