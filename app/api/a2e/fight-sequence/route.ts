import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { moves, characters, userId } = await req.json();

    console.log('Fight Sequence Request:', {
      movesCount: moves?.length || 0,
      charactersCount: characters?.length || 0,
      userId,
    });

    if (!moves || moves.length === 0) {
      return NextResponse.json(
        { error: 'At least one move is required' },
        { status: 400 }
      );
    }

    if (!characters || characters.length === 0) {
      return NextResponse.json(
        { error: 'At least one character is required' },
        { status: 400 }
      );
    }

    // For each move, generate video using motion transfer
    const generatedClips: string[] = [];
    const character = characters[0]; // Use first character for all moves

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const motionVideoUrl = move.preset.preset_data.video_url;

      console.log(`Generating clip ${i + 1}/${moves.length}:`, move.preset.name);

      // Build request body - prefer avatar_id for better consistency
      const requestBody: any = {
        name: `Fight move ${i + 1}: ${move.preset.name}`,
        video_url: motionVideoUrl,
        positive_prompt: `${move.preset.name}, dynamic action, cinematic, high quality`,
        negative_prompt: 'blurry, ugly, duplicate, poorly drawn, deformed, static, low quality',
      };

      // Use avatar_id if available, otherwise use image_url
      if (character.avatar_id) {
        requestBody.user_video_twin_id = character.avatar_id;
        console.log(`Using trained avatar: ${character.avatar_id}`);
      } else {
        requestBody.image_url = character.image_url;
        console.log('Using image URL');
      }

      // Call A2E Motion Transfer for this move
      const response = await fetch('https://video.a2e.ai/api/v1/motionTransfer/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Failed to start motion transfer for move ${i + 1}`);
        continue;
      }

      const data = await response.json();
      if (data.code !== 0) {
        console.error(`A2E error for move ${i + 1}:`, data);
        continue;
      }

      const taskId = data.data._id;

      // Poll for completion
      let videoUrl = null;
      let attempts = 0;
      const maxAttempts = 36;

      while (attempts < maxAttempts && !videoUrl) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await fetch(`https://video.a2e.ai/api/v1/motionTransfer/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.A2E_API_TOKEN}`,
          },
        });

        const statusData = await statusResponse.json();

        if (statusData.code === 0 && statusData.data?.current_status === 'completed' && statusData.data?.result_url) {
          videoUrl = statusData.data.result_url;
          generatedClips.push(videoUrl);
          console.log(`✓ Clip ${i + 1} completed:`, videoUrl);
          break;
        }

        if (statusData.data?.current_status === 'failed') {
          console.error(`Motion transfer failed for move ${i + 1}`);
          break;
        }

        attempts++;
      }

      if (!videoUrl) {
        console.error(`Timeout for move ${i + 1}`);
      }
    }

    if (generatedClips.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any clips' },
        { status: 500 }
      );
    }

    // TODO: Video stitching - for now, return all clips
    // In the future, use FFmpeg or A2E's video concatenation API

    // Deduct credits (5 credits per move)
    const totalCredits = moves.length * 5;
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && profile.credits >= totalCredits) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - totalCredits })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -totalCredits,
            transaction_type: 'fight_sequence',
            description: `Fight sequence: ${moves.length} moves`,
          });
      }
    }

    return NextResponse.json({
      clips: generatedClips,
      status: 'success',
      message: `Generated ${generatedClips.length} out of ${moves.length} moves`,
    });
  } catch (error) {
    console.error('Fight sequence generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate fight sequence' },
      { status: 500 }
    );
  }
}
