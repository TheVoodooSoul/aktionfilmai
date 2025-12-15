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

// Supported ControlNet modes
type ControlNetMode = 'scribble' | 'canny' | 'openpose' | 'lineart' | 'softedge' | 'depth';

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, mode, userId, characterInfo, creativity } = await req.json();

    // Validate
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const controlnetMode: ControlNetMode = mode || 'scribble';

    console.log('ControlNet Request:', {
      mode: controlnetMode,
      promptPreview: (prompt || '').substring(0, 50),
      hasCharacterInfo: !!characterInfo,
    });

    // Upload image to get public URL
    let inputImageUrl = image;
    if (image.startsWith('data:')) {
      console.log('Uploading image for ControlNet...');
      inputImageUrl = await uploadBase64ToStorage(image, `controlnet/${userId || 'anonymous'}`);
      console.log('Uploaded to:', inputImageUrl);
    }

    // Build enhanced prompt
    let enhancedPrompt = prompt || 'cinematic action scene, highly detailed, dramatic lighting';

    if (characterInfo && characterInfo.length > 0) {
      const charDescriptions = characterInfo.map((char: any) =>
        `${char.name} wearing ${char.outfit}`
      ).join(', and ');
      enhancedPrompt = `${enhancedPrompt}, featuring ${charDescriptions}`;
    }

    // Add quality keywords
    enhancedPrompt += ', professional photography, 8k resolution, masterpiece quality, bright studio lighting, well-lit scene';

    // ControlNet conditioning scale based on creativity
    // Lower creativity = follow control image more strictly
    const controlnetScale = creativity ? Math.max(0.5, 1.2 - (creativity * 0.5)) : 0.9;

    console.log('Calling ModelsLab ControlNet:', {
      mode: controlnetMode,
      controlnetScale,
      prompt: enhancedPrompt.substring(0, 100),
    });

    // Call ModelsLab ControlNet API
    const modelsLabResponse = await fetch('https://modelslab.com/api/v5/controlnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: process.env.MODELSLAB_API_KEY,
        model_id: 'realistic-vision-51', // Good realistic model
        controlnet_model: controlnetMode,
        controlnet_type: controlnetMode,
        auto_hint: 'yes', // Auto-detect edges/pose from image
        prompt: enhancedPrompt,
        negative_prompt: '(worst quality:2), (low quality:2), (blurry), (bad anatomy), (disfigured), (deformed), (extra limbs), (bad proportions), watermark, text, logo, dark, underexposed, nsfw',
        init_image: inputImageUrl,
        width: '1024',
        height: '1024',
        samples: '1',
        num_inference_steps: '30',
        guidance_scale: '7.5',
        controlnet_conditioning_scale: controlnetScale.toString(),
        safety_checker: false,
        base64: 'no',
      }),
    });

    const modelsLabData = await modelsLabResponse.json();
    console.log('ControlNet response:', JSON.stringify(modelsLabData, null, 2));

    // Handle response
    let output: any = null;

    if (modelsLabData.status === 'success' && modelsLabData.output && modelsLabData.output.length > 0) {
      output = modelsLabData.output;
    } else if (modelsLabData.status === 'processing' && modelsLabData.fetch_result) {
      // Poll for result
      console.log('ControlNet processing, polling...');
      let attempts = 0;
      while (attempts < 60) { // ControlNet can take longer
        await new Promise(resolve => setTimeout(resolve, 1500));
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
          throw new Error('ControlNet generation failed: ' + (pollData.message || 'Unknown error'));
        }
        attempts++;
      }
      if (!output) throw new Error('ControlNet generation timed out');
    } else if (modelsLabData.status === 'error') {
      throw new Error('ControlNet error: ' + (modelsLabData.message || 'Unknown'));
    }

    console.log('ControlNet output:', JSON.stringify(output, null, 2));

    // Extract image URL
    let outputImageUrl: string | null = null;

    if (Array.isArray(output) && output.length > 0) {
      outputImageUrl = output[0];
    } else if (typeof output === 'string') {
      outputImageUrl = output;
    }

    if (!outputImageUrl || !outputImageUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'No image generated from ControlNet' },
        { status: 500 }
      );
    }

    // Deduct credits (ControlNet costs 1 credit like img2img)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';
    const creditCost = 1;

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
            transaction_type: 'controlnet',
            description: `ControlNet ${controlnetMode} generation`,
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: outputImageUrl,
      status: 'success',
      mode: controlnetMode,
    });
  } catch (error: any) {
    console.error('ControlNet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
