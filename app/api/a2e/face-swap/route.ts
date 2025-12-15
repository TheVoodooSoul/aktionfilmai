import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

// Helper to upload base64 to Supabase and get public URL + mime type
async function uploadBase64ToStorage(base64Data: string, folder: string): Promise<{ url: string; mimeType: string }> {
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

  return { url: publicUrl, mimeType };
}

// Check if mime type is video
function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * A2E Face Swap API
 * Swap faces in images or videos for character consistency
 * Uses different endpoints based on target media type:
 * - Images: /api/v1/userFaceSwapImage/add
 * - Videos: /api/v1/userFaceSwapTask/add
 */
export async function POST(req: NextRequest) {
  try {
    const { faceUrl, faceBase64, videoUrl, videoBase64, name, userId } = await req.json();

    // Upload base64 to storage if provided
    let faceSource = faceUrl;
    let targetSource = videoUrl;
    let isVideoTarget = false;

    if (faceBase64) {
      console.log('Uploading face image to storage...');
      const { url } = await uploadBase64ToStorage(faceBase64, `face-swap/${userId || 'anonymous'}`);
      faceSource = url;
      console.log('Face image uploaded:', faceSource);
    }

    if (videoBase64) {
      console.log('Uploading target media to storage...');
      const { url, mimeType } = await uploadBase64ToStorage(videoBase64, `face-swap/${userId || 'anonymous'}`);
      targetSource = url;
      isVideoTarget = isVideoMimeType(mimeType);
      console.log('Target media uploaded:', targetSource, 'isVideo:', isVideoTarget);
    }

    console.log('A2E Face Swap Request:', {
      hasFaceSource: !!faceSource,
      hasTargetSource: !!targetSource,
      isVideoTarget,
      name,
      userId,
    });

    if (!faceSource || !targetSource) {
      return NextResponse.json(
        { error: 'Both face image and target image/video are required' },
        { status: 400 }
      );
    }

    let resultUrl = null;
    let taskId = null;

    if (isVideoTarget) {
      // VIDEO FACE SWAP - Use userFaceSwapTask endpoint
      const response = await fetch('https://video.a2e.ai/api/v1/userFaceSwapTask/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || 'Face Swap',
          face_url: faceSource,
          video_url: targetSource,
        }),
      });

      console.log('A2E Video Face Swap Response status:', response.status);
      const responseText = await response.text();
      console.log('A2E Video Face Swap Response:', responseText.substring(0, 500));

      if (!response.ok) {
        return NextResponse.json(
          { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
          { status: 500 }
        );
      }

      const data = JSON.parse(responseText);

      if (data.code !== 0) {
        return NextResponse.json(
          { error: 'A2E API returned an error: ' + (data.message || data.msg || 'Unknown error') },
          { status: 500 }
        );
      }

      taskId = data.data._id;
      console.log('A2E Video Face Swap Task ID:', taskId);

      // Poll for completion (max 3 minutes, check every 3 seconds)
      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts && !resultUrl) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userFaceSwapTask/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
          },
        });

        const statusData = await statusResponse.json();
        console.log(`Video face swap polling attempt ${attempts + 1}:`, statusData.data?.current_status);

        if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
          resultUrl = statusData.data.result_url;
          break;
        }

        if (statusData.data?.current_status === 'failed') {
          return NextResponse.json(
            { error: 'Face swap failed: ' + (statusData.data?.faild_message || 'Unknown error') },
            { status: 500 }
          );
        }

        attempts++;
      }
    } else {
      // IMAGE FACE SWAP - A2E API only supports video face swap
      // For images, they have "Head Swap" which is a different feature
      return NextResponse.json(
        { error: 'Face swap currently only supports video files. Please upload an MP4, WebM, or MOV video as the target.' },
        { status: 400 }
      );
    }

    if (!resultUrl) {
      return NextResponse.json(
        { error: 'Face swap timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (10 credits for face swap)
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
            transaction_type: 'face_swap',
            description: 'Face swap (A2E)',
          });
      }
    }

    return NextResponse.json({
      output_url: resultUrl,
      task_id: taskId,
      media_type: isVideoTarget ? 'video' : 'image',
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Face Swap error:', error);
    return NextResponse.json(
      { error: 'Failed to swap face' },
      { status: 500 }
    );
  }
}
