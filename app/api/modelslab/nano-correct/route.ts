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
    const { image, mask, prompt, userId, strength } = await req.json();

    // Validate inputs
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!mask) {
      return NextResponse.json(
        { error: 'No mask provided' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    // Upload image to Supabase to get a public URL if it's a data URI
    let inputImageUrl = image;
    let maskImageUrl = mask;

    if (image.startsWith('data:')) {
      console.log('Uploading image to Supabase storage for nano-correct...');
      try {
        inputImageUrl = await uploadBase64ToStorage(image, `nano-correct/${userId || 'anonymous'}`);
        console.log('Image uploaded to:', inputImageUrl);
      } catch (uploadError: any) {
        console.error('Failed to upload image:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload image: ' + uploadError.message },
          { status: 500 }
        );
      }
    }

    if (mask.startsWith('data:')) {
      console.log('Uploading mask to Supabase storage...');
      try {
        maskImageUrl = await uploadBase64ToStorage(mask, `nano-correct/${userId || 'anonymous'}/masks`);
        console.log('Mask uploaded to:', maskImageUrl);
      } catch (uploadError: any) {
        console.error('Failed to upload mask:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload mask: ' + uploadError.message },
          { status: 500 }
        );
      }
    }

    console.log('ModelsLab Inpaint Request:', {
      inputImageUrl: inputImageUrl.substring(0, 80) + '...',
      maskImageUrl: maskImageUrl.substring(0, 80) + '...',
      prompt: prompt.substring(0, 50),
      strength: strength || 0.7,
    });

    // Call ModelsLab inpaint API
    const modelsLabResponse = await fetch('https://modelslab.com/api/v6/images/inpaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY,
        init_image: inputImageUrl,
        mask_image: maskImageUrl,
        prompt: prompt,
        samples: '1',
        negative_prompt: '(worst quality:2), (low quality:2), (blurry), (bad anatomy), (disfigured), (deformed), (extra limbs), (bad proportions), watermark, text, logo',
        model_id: 'fluxdev',
        num_inference_steps: '31',
        strength: (strength || 0.7).toString(),
        scheduler: 'DPMSolverMultistepScheduler',
        guidance_scale: '7.5',
        base64: 'no',
      }),
    });

    const modelsLabData = await modelsLabResponse.json();
    console.log('ModelsLab inpaint response:', JSON.stringify(modelsLabData, null, 2));

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
          throw new Error('ModelsLab inpaint failed');
        }
        attempts++;
      }
      if (!output) throw new Error('ModelsLab inpaint timed out');
    } else if (modelsLabData.status === 'error') {
      throw new Error('ModelsLab error: ' + (modelsLabData.message || 'Unknown'));
    }

    console.log('ModelsLab inpaint output:', JSON.stringify(output, null, 2));

    // Handle output - it's an array of URLs
    let outputImageUrl: string | null = null;

    if (Array.isArray(output) && output.length > 0) {
      outputImageUrl = output[0];
    } else if (typeof output === 'string') {
      outputImageUrl = output;
    }

    if (!outputImageUrl || !outputImageUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'No image generated from ModelsLab inpaint' },
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
            transaction_type: 'nano_correct',
            description: 'Nano correct/inpaint (ModelsLab)',
          });
      }
    }

    return NextResponse.json({
      output_url: outputImageUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('ModelsLab Nano Correct error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to correct image' },
      { status: 500 }
    );
  }
}
