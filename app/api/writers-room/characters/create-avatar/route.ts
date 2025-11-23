import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Create A2E avatar for a script character
 * Uses A2E avatar training API
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { characterId, scriptId, imageUrl, videoUrl, name, gender, description } = await req.json();

    if (!characterId || !scriptId) {
      return NextResponse.json(
        { error: 'Character ID and Script ID are required' },
        { status: 400 }
      );
    }

    if (!imageUrl && !videoUrl) {
      return NextResponse.json(
        { error: 'Either image URL or video URL is required' },
        { status: 400 }
      );
    }

    // Verify script belongs to user
    const { data: script } = await supabase
      .from('scripts')
      .select('id')
      .eq('id', scriptId)
      .eq('user_id', user.id)
      .single();

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Get character info
    const { data: character } = await supabase
      .from('script_characters')
      .select('*')
      .eq('id', characterId)
      .eq('script_id', scriptId)
      .single();

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Build avatar name
    const avatarName = name || character.name || `Character - ${characterId.substring(0, 8)}`;
    const avatarGender = gender || 'male'; // Default, can be improved with detection

    // Call A2E avatar training API
    const avatarResponse = await fetch('https://video.a2e.ai/api/v1/userVideoTwin/startTraining', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        name: avatarName,
        gender: avatarGender,
        ...(videoUrl ? { video_url: videoUrl } : { image_url: imageUrl }),
        prompt: description || `action character, ${character.name}`,
        negative_prompt: 'blurry, distorted, low quality',
        model_version: 'V2.1',
        skipPreview: false,
      }),
    });

    if (!avatarResponse.ok) {
      const errorText = await avatarResponse.text();
      console.error('A2E avatar training error:', errorText);
      return NextResponse.json(
        { error: 'Avatar training failed' },
        { status: 500 }
      );
    }

    const avatarData = await avatarResponse.json();

    if (avatarData.code !== 0) {
      return NextResponse.json(
        { error: avatarData.message || 'Avatar training failed' },
        { status: 500 }
      );
    }

    const avatarId = avatarData.data?._id;

    // Update character with avatar ID
    await supabase
      .from('script_characters')
      .update({
        image_url: avatarData.data?.image_result_url || imageUrl,
        // Store avatar_id in metadata or separate field
      })
      .eq('id', characterId);

    // Deduct credits for image avatar (video is free)
    if (imageUrl && user.id !== '00000000-0000-0000-0000-000000000001') {
      const creditCost = 30;
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profile && profile.credits >= creditCost) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - creditCost })
          .eq('id', user.id);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            amount: -creditCost,
            transaction_type: 'generation',
            description: `Character avatar training - ${character.name}`,
          });
      }
    }

    return NextResponse.json({
      success: true,
      avatarId,
      avatarStatus: 'training',
      message: videoUrl ? 'Video avatar training started (FREE!)' : 'Image avatar training started',
    });
  } catch (error: any) {
    console.error('Character avatar creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Avatar creation failed' },
      { status: 500 }
    );
  }
}



