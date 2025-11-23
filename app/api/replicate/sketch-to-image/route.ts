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

    // Use jagilley/controlnet-scribble - SDXL-based ControlNet optimized for sketches
    // ✅ NO violence filtering (unlike Flux)
    // ✅ Great for fight scenes and action sequences
    const output = await replicate.run(
      "jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117",
      {
        input: {
          image: image, // Base64 data URI or URL
          prompt: enhancedPrompt,
          negative_prompt: "blurry, low quality, distorted, deformed, cartoon, anime, text, watermark, signature, amateur",
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: creativity ? creativity * 12 : 7.5, // Higher scale for more dramatic results
          scheduler: "K_EULER_ANCESTRAL",
          // CRITICAL: No safety filters - allows violence/action content
          disable_safety_checker: true,
        },
      }
    );

    console.log('Replicate ControlNet output:', output);

    // Replicate returns an array of URLs
    const imageUrl = Array.isArray(output) ? output[0] : output;

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
