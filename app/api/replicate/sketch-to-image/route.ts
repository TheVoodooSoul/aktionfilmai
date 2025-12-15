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
    const { image, prompt, creativity, userId, characterInfo } = await req.json();

    // Validate image data
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Log image info for debugging
    const isDataUri = image.startsWith('data:');
    const imagePrefix = image.substring(0, 50);
    console.log('Image input info:', {
      isDataUri,
      prefix: imagePrefix,
      length: image.length,
    });

    // Upload image to Supabase to get a public URL (SDXL requires URL, not data URI)
    let inputImageUrl = image;
    if (isDataUri) {
      console.log('Uploading sketch to Supabase storage...');
      try {
        inputImageUrl = await uploadBase64ToStorage(image, `sketches/${userId || 'anonymous'}`);
        console.log('Sketch uploaded to:', inputImageUrl);
      } catch (uploadError: any) {
        console.error('Failed to upload sketch:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload sketch: ' + uploadError.message },
          { status: 500 }
        );
      }
    }

    // Build enhanced prompt with character info
    let enhancedPrompt = prompt || 'cinematic action scene, highly detailed, dramatic lighting, professional photography';

    if (characterInfo && characterInfo.length > 0) {
      const charDescriptions = characterInfo.map((char: any) =>
        `${char.name} wearing ${char.outfit}`
      ).join(', and ');
      enhancedPrompt = `${enhancedPrompt}, featuring ${charDescriptions}`;
    }

    // Add action/combat keywords and LIGHTING for better results (prevent dark outputs)
    enhancedPrompt += ', action movie scene, intense fight, dynamic movement, epic cinematography, bright studio lighting, well-lit scene, professional lighting setup, clear visibility';

    // Use ModelsLab Flux img2img for high quality sketch-to-image
    console.log('ModelsLab Flux Request:', {
      prompt: enhancedPrompt,
      inputImageUrl: inputImageUrl.substring(0, 80) + '...',
      creativity,
    });

    // Map creativity (0-1) to strength
    // Higher strength = more creative freedom from sketch
    // Lower strength = follows sketch more closely
    const strengthValue = creativity ? Math.max(0.35, Math.min(0.75, 0.4 + (creativity * 0.35))) : 0.55;

    // Use ModelsLab img2img with flux-2-dev model (confirmed to allow action content)
    const modelsLabResponse = await fetch('https://modelslab.com/api/v6/images/img2img', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY,
        init_image: inputImageUrl,
        prompt: enhancedPrompt,
        model_id: 'flux-2-dev', // Updated to flux-2-dev for better action content support
        width: '1024',
        height: '1024',
        samples: '1',
        negative_prompt: '(worst quality:2), (low quality:2), (blurry), (bad anatomy), (disfigured), (deformed), (extra limbs), (bad proportions), (bad hands), (poorly drawn hands), (poorly drawn face), watermark, text, logo, dark, underexposed',
        num_inference_steps: '31',
        strength: strengthValue.toString(),
        scheduler: 'DPMSolverMultistepScheduler',
        guidance_scale: '7.5',
        safety_checker: false, // Disable safety filter for action content
        safety_checker_type: '', // No safety checker type
        base64: 'no',
      }),
    });

    const modelsLabData = await modelsLabResponse.json();
    console.log('ModelsLab response:', JSON.stringify(modelsLabData, null, 2));

    // Handle ModelsLab response
    let output: any = null;

    if (modelsLabData.status === 'success' && modelsLabData.output && modelsLabData.output.length > 0) {
      output = modelsLabData.output;
    } else if (modelsLabData.status === 'processing' && modelsLabData.fetch_result) {
      // Poll for result
      console.log('ModelsLab processing, polling...');
      let attempts = 0;
      while (attempts < 30) {
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
          throw new Error('ModelsLab generation failed');
        }
        attempts++;
      }
      if (!output) throw new Error('ModelsLab generation timed out');
    } else if (modelsLabData.status === 'error') {
      throw new Error('ModelsLab error: ' + (modelsLabData.message || 'Unknown'));
    }

    console.log('ModelsLab output:', JSON.stringify(output, null, 2));

    // Handle ModelsLab output - it's an array of URLs
    let outputImageUrl: string | null = null;

    if (Array.isArray(output) && output.length > 0) {
      outputImageUrl = output[0];
    } else if (typeof output === 'string') {
      outputImageUrl = output;
    }

    console.log('Extracted outputImageUrl:', outputImageUrl);

    if (!outputImageUrl || !outputImageUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'No image generated from ModelsLab' },
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
            transaction_type: 'preview',
            description: 'Sketch to image (ModelsLab Flux)',
          });
      }
    }

    return NextResponse.json({
      output_url: outputImageUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('ModelsLab Flux error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
