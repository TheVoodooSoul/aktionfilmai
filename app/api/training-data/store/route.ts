import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      outputUrl,
      outputType, // 'image' | 'video'
      nodeType, // 'character', 'scene', 'sketch', etc.
      prompt,
      settings,
      characterRefs,
      inputImageUrl,
      inputImages,
      generationTimeSeconds,
    } = body;

    if (!userId || !outputUrl || !outputType || !nodeType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has opted in
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('data_sharing_opt_in')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user opt-in status:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only store if user has opted in
    if (!userData.data_sharing_opt_in) {
      return NextResponse.json({
        success: false,
        message: 'User has not opted in to data sharing',
      });
    }

    // Store the training data
    const { data, error } = await supabase
      .from('shared_training_data')
      .insert({
        user_id: userId,
        output_url: outputUrl,
        output_type: outputType,
        node_type: nodeType,
        prompt: prompt || null,
        settings: settings || null,
        character_refs: characterRefs || null,
        input_image_url: inputImageUrl || null,
        input_images: inputImages || null,
        generation_time_seconds: generationTimeSeconds || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing training data:', error);
      return NextResponse.json(
        { error: 'Failed to store training data' },
        { status: 500 }
      );
    }

    console.log(`✓ Training data stored for user ${userId}: ${nodeType} - ${outputType}`);

    return NextResponse.json({
      success: true,
      message: 'Training data stored successfully',
      id: data.id,
    });
  } catch (error) {
    console.error('Error in store training data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
