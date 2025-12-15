import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

const CREDIT_COST = 2; // 2 credits per storyboard frame (~$0.08, cost ~$0.01-0.02)

export async function POST(req: NextRequest) {
  try {
    const { description, shotType, style, userId } = await req.json();

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Scene description is required' },
        { status: 400 }
      );
    }

    // Check user credits (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < CREDIT_COST) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${CREDIT_COST} credits.` },
          { status: 402 }
        );
      }
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Build storyboard-optimized prompt
    const prompt = buildStoryboardPrompt(description, shotType, style);

    console.log('Replicate Storyboard Request:', {
      description,
      shotType,
      style,
      prompt,
    });

    // Use SDXL Lightning for fast, cheap generation (~$0.01 per image)
    const output = await replicate.run(
      "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 576, // 16:9 for cinematic storyboards
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 4, // Lightning fast
          guidance_scale: 0, // Lightning model doesn't use guidance
          negative_prompt: "blurry, low quality, text, watermark, signature, color, vibrant colors, saturated",
        },
      }
    );

    console.log('Replicate Storyboard output:', output);

    // Handle output
    let imageUrl: string | null = null;

    if (typeof output === 'string') {
      imageUrl = output;
    } else if (Array.isArray(output)) {
      const firstItem = output[0];
      if (typeof firstItem === 'string') {
        imageUrl = firstItem;
      } else if (firstItem && typeof firstItem === 'object') {
        imageUrl = firstItem.url?.() || firstItem.toString() || String(firstItem);
      }
    } else if (typeof output === 'object' && output !== null) {
      const obj = output as any;
      if (typeof obj.url === 'function') {
        imageUrl = obj.url();
      } else if (typeof obj.url === 'string') {
        imageUrl = obj.url;
      } else {
        imageUrl = String(output);
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // Deduct credits
    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - CREDIT_COST })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -CREDIT_COST,
            transaction_type: 'storyboard',
            description: `Storyboard frame: ${description.slice(0, 50)}...`,
          });
      }
    }

    return NextResponse.json({
      output_url: imageUrl,
      status: 'success',
      credits_used: CREDIT_COST,
    });
  } catch (error: any) {
    console.error('Replicate Storyboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate storyboard' },
      { status: 500 }
    );
  }
}

function buildStoryboardPrompt(description: string, shotType?: string, style?: string): string {
  // Shot type modifiers
  const shotModifiers: Record<string, string> = {
    'wide': 'wide establishing shot, full scene visible',
    'medium': 'medium shot, waist up',
    'close': 'close-up shot, face and shoulders',
    'extreme-close': 'extreme close-up, eyes or detail',
    'over-shoulder': 'over the shoulder shot',
    'low-angle': 'low angle shot, looking up, powerful',
    'high-angle': 'high angle shot, looking down',
    'dutch': 'dutch angle, tilted frame, tension',
  };

  // Style modifiers
  const styleModifiers: Record<string, string> = {
    'sketch': 'black and white pencil sketch storyboard, rough lines, hand-drawn',
    'comic': 'comic book style, bold lines, high contrast black and white',
    'cinematic': 'cinematic storyboard, professional, grayscale, film noir lighting',
    'anime': 'anime storyboard style, dynamic poses, speed lines',
    'realistic': 'photorealistic storyboard, dramatic lighting, film still',
  };

  const shot = shotModifiers[shotType || 'medium'] || shotModifiers['medium'];
  const artStyle = styleModifiers[style || 'cinematic'] || styleModifiers['cinematic'];

  return `${artStyle}, ${shot}, ${description}, action movie storyboard, professional cinematography, dramatic composition, masterful staging`;
}

// Batch generation for full script storyboard
export async function PUT(req: NextRequest) {
  try {
    const { scenes, userId } = await req.json();

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Scenes array is required' },
        { status: 400 }
      );
    }

    const BATCH_CREDIT_COST = 15; // 15 credits for up to 10 frames
    const MAX_FRAMES = 10;

    // Check credits
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < BATCH_CREDIT_COST) {
        return NextResponse.json(
          { error: `Insufficient credits. Need ${BATCH_CREDIT_COST} credits for batch storyboard.` },
          { status: 402 }
        );
      }
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // Generate frames (limit to MAX_FRAMES)
    const framesToGenerate = scenes.slice(0, MAX_FRAMES);
    const results: Array<{ description: string; imageUrl: string }> = [];

    for (const scene of framesToGenerate) {
      const prompt = buildStoryboardPrompt(scene.description, scene.shotType, scene.style);

      const output = await replicate.run(
        "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        {
          input: {
            prompt: prompt,
            width: 1024,
            height: 576,
            num_outputs: 1,
            scheduler: "K_EULER",
            num_inference_steps: 4,
            guidance_scale: 0,
            negative_prompt: "blurry, low quality, text, watermark, signature",
          },
        }
      );

      let imageUrl = '';
      if (Array.isArray(output) && output[0]) {
        imageUrl = typeof output[0] === 'string' ? output[0] : String(output[0]);
      } else if (typeof output === 'string') {
        imageUrl = output;
      }

      if (imageUrl) {
        results.push({
          description: scene.description,
          imageUrl,
        });
      }
    }

    // Deduct batch credits
    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - BATCH_CREDIT_COST })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -BATCH_CREDIT_COST,
            transaction_type: 'storyboard_batch',
            description: `Batch storyboard: ${results.length} frames`,
          });
      }
    }

    return NextResponse.json({
      frames: results,
      status: 'success',
      credits_used: BATCH_CREDIT_COST,
      frames_generated: results.length,
    });
  } catch (error: any) {
    console.error('Batch storyboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate batch storyboard' },
      { status: 500 }
    );
  }
}
