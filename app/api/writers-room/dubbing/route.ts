import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Generate dubbed audio for script dialogue using A2E dubbing API
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

    const { scriptId, sceneId, dialogue, voiceId, targetLanguage } = await req.json();

    if (!scriptId || !dialogue) {
      return NextResponse.json(
        { error: 'Script ID and dialogue are required' },
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

    // Call A2E dubbing API
    const dubbingResponse = await fetch('https://video.a2e.ai/api/v1/userDubbing/startDubbing', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        text: dialogue,
        voice_id: voiceId || 'default',
        target_language: targetLanguage || 'en',
        // Additional dubbing parameters
      }),
    });

    if (!dubbingResponse.ok) {
      const errorText = await dubbingResponse.text();
      console.error('A2E dubbing error:', errorText);
      return NextResponse.json(
        { error: 'Dubbing failed' },
        { status: 500 }
      );
    }

    const dubbingData = await dubbingResponse.json();

    if (dubbingData.code !== 0) {
      return NextResponse.json(
        { error: dubbingData.message || 'Dubbing failed' },
        { status: 500 }
      );
    }

    const taskId = dubbingData.data?._id;

    return NextResponse.json({
      success: true,
      taskId,
      statusUrl: `https://video.a2e.ai/api/v1/userDubbing/${taskId}`,
      message: 'Dubbing started',
    });
  } catch (error: any) {
    console.error('Dubbing error:', error);
    return NextResponse.json(
      { error: error.message || 'Dubbing failed' },
      { status: 500 }
    );
  }
}



