import { NextRequest, NextResponse } from 'next/server';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';

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
    const { image, prompt, userId, scale } = await req.json();

    // Validate image data
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Upload image to Supabase to get a public URL if it's a data URI
    let inputImageUrl = image;
    const isDataUri = image.startsWith('data:');

    if (isDataUri) {
      console.log('Uploading image to Supabase storage for upscale...');
      try {
        inputImageUrl = await uploadBase64ToStorage(image, `upscale/${userId || 'anonymous'}`);
        console.log('Image uploaded to:', inputImageUrl);
      } catch (uploadError: any) {
        console.error('Failed to upload image:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload image: ' + uploadError.message },
          { status: 500 }
        );
      }
    }

    console.log('ModelsLab Super Resolution Request:', {
      inputImageUrl: inputImageUrl.substring(0, 80) + '...',
      prompt: prompt?.substring(0, 50) || 'none',
      scale: scale || 2,
    });

    // Call ModelsLab super resolution API
    const modelsLabResponse = await fetch('https://modelslab.com/api/v6/image_editing/super_resolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY,
        init_image: inputImageUrl,
        prompt: prompt || 'high quality, detailed, sharp, professional',
        samples: '1',
        negative_prompt: '(worst quality:2), (low quality:2), (normal quality:2), (jpeg artifacts), (blurry), (duplicate), (morbid), (mutilated), (out of frame), (extra limbs), (bad anatomy), (disfigured), (deformed), (cross-eye), (glitch), (oversaturated), (overexposed), (underexposed), (bad proportions), (bad hands), (bad feet), (cloned face), (long neck), (missing arms), (missing legs), (extra fingers), (fused fingers), (poorly drawn hands), (poorly drawn face), (mutation), (deformed eyes), watermark, text, logo, signature, grainy, tiling, censored, nsfw, ugly, blurry eyes, noisy image, bad lighting, unnatural skin, asymmetry',
        model_id: 'fluxdev',
        num_inference_steps: '31',
        strength: '0.5',
        scheduler: 'DPMSolverMultistepScheduler',
        guidance_scale: '7.5',
        base64: 'no',
      }),
    });

    const modelsLabData = await modelsLabResponse.json();
    console.log('ModelsLab super resolution response:', JSON.stringify(modelsLabData, null, 2));

    // Handle ModelsLab response
    let output: any = null;

    if (modelsLabData.status === 'success' && modelsLabData.output && modelsLabData.output.length > 0) {
      output = modelsLabData.output;
    } else if (modelsLabData.status === 'processing' && modelsLabData.fetch_result) {
      // Poll for result
      console.log('ModelsLab processing, polling...');
      let attempts = 0;
      while (attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(modelsLabData.fetch_result, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: process.env.MODELSLAB_API_KEY }),
        });
        const pollData = await pollResponse.json();
        console.log('Poll attempt', attempts + 1, ':', pollData.status);
        if (pollData.status === 'success' && pollData.output && pollData.output.length > 0) {
          output = pollData.output;
          break;
        } else if (pollData.status === 'failed') {
          throw new Error('ModelsLab upscale failed');
        }
        attempts++;
      }
      if (!output) throw new Error('ModelsLab upscale timed out');
    } else if (modelsLabData.status === 'error') {
      throw new Error('ModelsLab error: ' + (modelsLabData.message || 'Unknown'));
    }

    console.log('ModelsLab upscale output:', JSON.stringify(output, null, 2));

    // Handle output - it's an array of URLs
    let outputImageUrl: string | null = null;

    if (Array.isArray(output) && output.length > 0) {
      outputImageUrl = output[0];
    } else if (typeof output === 'string') {
      outputImageUrl = output;
    }

    if (!outputImageUrl || !outputImageUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'No image generated from ModelsLab upscale' },
        { status: 500 }
      );
    }

    // Deduct 1 credit from user (skip for super admin)
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
          .update({ credits: profile.credits - 1 })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -1,
            transaction_type: 'upscale',
            description: 'Image upscale (ModelsLab Super Resolution)',
          });
      }
    }

    return NextResponse.json({
      output_url: outputImageUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('ModelsLab Upscale error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upscale image' },
      { status: 500 }
    );
  }
}
