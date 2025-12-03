import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, creativity, userId, characterInfo } = await req.json();

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    // Validate and log image data
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

    // Ensure the data URI has the correct format
    let processedImage = image;
    if (isDataUri) {
      // Extract mime type and validate
      const mimeMatch = image.match(/^data:([^;]+);base64,/);
      if (!mimeMatch) {
        return NextResponse.json(
          { error: 'Invalid image data URI format' },
          { status: 400 }
        );
      }
      console.log('Image mime type:', mimeMatch[1]);
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Build enhanced prompt with character info
    let enhancedPrompt = prompt || 'cinematic action scene, highly detailed, dramatic lighting, professional photography';

    if (characterInfo && characterInfo.length > 0) {
      const charDescriptions = characterInfo.map((char: any) =>
        `${char.name} wearing ${char.outfit}`
      ).join(', and ');
      enhancedPrompt = `${enhancedPrompt}, featuring ${charDescriptions}`;
    }

    // Add action/combat keywords for better results
    enhancedPrompt += ', action movie scene, intense fight, dynamic movement, epic cinematography';

    console.log('Replicate ControlNet Scribble Request:', {
      hasToken: !!process.env.REPLICATE_API_TOKEN,
      prompt: enhancedPrompt,
      hasImage: !!image,
      creativity,
    });

    // Use stability-ai/sdxl for image generation with img2img
    // More reliable than controlnet models
    console.log('Calling Replicate SDXL with image length:', processedImage.length);

    const output = await replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
      {
        input: {
          image: processedImage,
          prompt: enhancedPrompt,
          num_outputs: 1,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          prompt_strength: creativity ? creativity : 0.8, // How much to transform the image
          negative_prompt: "blurry, low quality, distorted, deformed, cartoon, anime, text, watermark, signature, amateur, lowres, bad anatomy, bad hands",
        },
      }
    );

    console.log('Replicate ControlNet raw output type:', typeof output);
    console.log('Replicate ControlNet output:', JSON.stringify(output, null, 2));

    // Handle different output types from Replicate
    let imageUrl: string | null = null;

    if (typeof output === 'string') {
      // Direct string URL
      imageUrl = output;
    } else if (Array.isArray(output)) {
      // Array of URLs or FileOutput objects
      const firstItem = output[0];
      if (typeof firstItem === 'string') {
        imageUrl = firstItem;
      } else if (firstItem && typeof firstItem === 'object') {
        // FileOutput object - convert to string
        imageUrl = firstItem.url?.() || firstItem.toString() || String(firstItem);
      }
    } else if (typeof output === 'object' && output !== null) {
      // Single object response
      const obj = output as any;
      if (typeof obj.url === 'function') {
        imageUrl = obj.url();
      } else if (typeof obj.url === 'string') {
        imageUrl = obj.url;
      } else if (typeof obj.output === 'string') {
        imageUrl = obj.output;
      } else if (Array.isArray(obj.output)) {
        const firstOutput = obj.output[0];
        imageUrl = typeof firstOutput === 'string' ? firstOutput : String(firstOutput);
      } else {
        // Try toString as last resort
        imageUrl = String(output);
      }
    }

    // Ensure imageUrl is a string for logging
    const urlPreview = typeof imageUrl === 'string' ? imageUrl.substring(0, 100) : String(imageUrl);
    console.log('Processed imageUrl:', urlPreview + '...');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image generated from ControlNet' },
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
            description: 'Sketch to image (Replicate ControlNet Scribble)',
          });
      }
    }

    return NextResponse.json({
      output_url: imageUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Replicate ControlNet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
