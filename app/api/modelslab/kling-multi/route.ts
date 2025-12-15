import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

// Helper to upload base64 to Supabase and get public URL
async function uploadBase64ToStorage(base64Data: string, folder: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();

  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data');
  }

  const mimeType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, 'base64');

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[mimeType] || 'png';

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

export async function POST(req: NextRequest) {
  try {
    const { images, prompt, duration, aspectRatio, userId } = await req.json();

    // Validate - need array of images for multi-reference
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided. Kling multi-reference requires an array of images.' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    // Process all images - upload any data URIs
    const processedImages: string[] = [];
    for (let i = 0; i < images.length; i++) {
      let imageUrl = images[i];
      if (imageUrl.startsWith('data:')) {
        console.log(`Uploading image ${i + 1}/${images.length} for Kling multi...`);
        imageUrl = await uploadBase64ToStorage(imageUrl, `kling-multi/${userId || 'anonymous'}`);
        console.log('Uploaded to:', imageUrl);
      }
      processedImages.push(imageUrl);
    }

    console.log('Kling v1.6 Multi-Reference Request:', {
      imageCount: processedImages.length,
      prompt: prompt.substring(0, 100),
      duration: duration || '10',
      aspectRatio: aspectRatio || '16:9',
    });

    // Call ModelsLab Kling v1.6 with multiple references
    const modelsLabResponse = await fetch('https://modelslab.com/api/v7/video-fusion/image-to-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY,
        init_image: processedImages, // Array of images
        prompt: prompt,
        duration: (duration || 10).toString(),
        model_id: 'kling-v1-6',
        aspect_ratio: aspectRatio || '16:9',
      }),
    });

    const modelsLabData = await modelsLabResponse.json();
    console.log('Kling multi response:', JSON.stringify(modelsLabData, null, 2));

    // Handle response
    let output: any = null;

    if (modelsLabData.status === 'success' && modelsLabData.output) {
      output = modelsLabData.output;
    } else if (modelsLabData.status === 'processing' && modelsLabData.fetch_result) {
      // Poll for result - multi-ref can take longer
      console.log('Kling multi processing, polling...');
      let attempts = 0;
      while (attempts < 150) { // 5 minutes max polling for multi-ref
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2s
        const pollResponse = await fetch(modelsLabData.fetch_result, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: process.env.MODELSLAB_API_KEY }),
        });
        const pollData = await pollResponse.json();
        console.log('Poll attempt', attempts + 1, ':', pollData.status);
        if (pollData.status === 'success' && pollData.output) {
          output = pollData.output;
          break;
        } else if (pollData.status === 'failed') {
          throw new Error('Kling multi generation failed: ' + (pollData.message || 'Unknown error'));
        }
        attempts++;
      }
      if (!output) throw new Error('Kling multi generation timed out');
    } else if (modelsLabData.status === 'error') {
      throw new Error('Kling error: ' + (modelsLabData.message || 'Unknown'));
    }

    console.log('Kling multi output:', JSON.stringify(output, null, 2));

    // Extract video URL
    let outputVideoUrl: string | null = null;
    if (Array.isArray(output) && output.length > 0) {
      outputVideoUrl = output[0];
    } else if (typeof output === 'string') {
      outputVideoUrl = output;
    }

    if (!outputVideoUrl || !outputVideoUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'No video generated from Kling multi-reference' },
        { status: 500 }
      );
    }

    // Deduct credits (premium - 8 credits for multi-ref, 10s video)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';
    const creditCost = 8; // Multi-ref costs more

    if (userId && !isSuperAdmin) {
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
            transaction_type: 'kling_multi',
            description: `Kling v1.6 multi-reference i2v (${processedImages.length} refs, Premium)`,
          });
      } else {
        return NextResponse.json(
          { error: `Insufficient credits. Kling multi-reference requires ${creditCost} credits.` },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: outputVideoUrl,
      status: 'success',
      model: 'kling-v1-6',
      references_used: processedImages.length,
    });
  } catch (error: any) {
    console.error('Kling multi error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video' },
      { status: 500 }
    );
  }
}
