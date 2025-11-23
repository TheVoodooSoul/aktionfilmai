import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Generate video from script scene using A2E video generation
 * Integrates script content with A2E avatar video generation
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

    const { scriptId, sceneId, avatarId, backgroundUrl } = await req.json();
    let { dialogue } = await req.json();

    if (!scriptId || !avatarId) {
      return NextResponse.json(
        { error: 'Script ID and Avatar ID are required' },
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

    // Get scene content if sceneId provided
    let sceneContent = '';
    if (sceneId) {
      const { data: scene } = await supabase
        .from('script_scenes')
        .select('content, dialogue')
        .eq('id', sceneId)
        .eq('script_id', scriptId)
        .single();

      if (scene) {
        sceneContent = scene.content;
        if (scene.dialogue && scene.dialogue.length > 0) {
          dialogue = scene.dialogue.join(' ');
        }
      }
    }

    // Generate TTS audio from dialogue if provided
    let audioUrl = null;
    if (dialogue) {
      const ttsResponse = await fetch('https://video.a2e.ai/api/v1/video/send_tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
          'Content-Type': 'application/json',
          'x-lang': 'en-US',
        },
        body: JSON.stringify({
          text: dialogue,
          voice_id: 'default', // Can be customized
        }),
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        audioUrl = ttsData.data?.audio_url;
      }
    }

    // Generate video using A2E
    const videoResponse = await fetch('https://video.a2e.ai/api/v1/video/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        user_video_twin_id: avatarId,
        text: dialogue || sceneContent.substring(0, 500), // Use dialogue or scene content
        audio_url: audioUrl,
        background_url: backgroundUrl,
        // Additional video generation parameters
      }),
    });

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('A2E video generation error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate video' },
        { status: 500 }
      );
    }

    const videoData = await videoResponse.json();

    if (videoData.code !== 0) {
      return NextResponse.json(
        { error: videoData.message || 'Video generation failed' },
        { status: 500 }
      );
    }

    const taskId = videoData.data?._id;

    return NextResponse.json({
      success: true,
      taskId,
      statusUrl: `https://video.a2e.ai/api/v1/video/awsResult`,
      message: 'Video generation started',
    });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Video generation failed' },
      { status: 500 }
    );
  }
}



