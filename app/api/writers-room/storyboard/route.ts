import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Generate storyboard images from script scenes using A2E text-to-image
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

    const { scriptId, sceneId, description, shotType } = await req.json();

    if (!scriptId || !sceneId || !description) {
      return NextResponse.json(
        { error: 'Script ID, scene ID, and description are required' },
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

    // Build prompt for storyboard image
    const prompt = buildStoryboardPrompt(description, shotType);

    // Call A2E text-to-image API
    const a2eResponse = await fetch('https://video.a2e.ai/api/v1/userText2image/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Storyboard - Scene ${sceneId}`,
        prompt: prompt,
        req_key: 'high_aes_general_v21_L', // High aesthetic quality
        width: 1024,
        height: 1024,
      }),
    });

    if (!a2eResponse.ok) {
      const errorText = await a2eResponse.text();
      console.error('A2E storyboard generation error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate storyboard image' },
        { status: 500 }
      );
    }

    const a2eData = await a2eResponse.json();

    if (a2eData.code !== 0 || !a2eData.data || !a2eData.data[0]) {
      return NextResponse.json(
        { error: 'A2E API returned an error' },
        { status: 500 }
      );
    }

    const taskId = a2eData.data[0]._id;

    // Poll for completion
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(`https://video.a2e.ai/api/v1/userText2image/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        },
      });

      const statusData = await statusResponse.json();

      if ((statusData.data?.current_status === 'done' || statusData.data?.current_status === 'completed') 
          && statusData.data?.image_urls?.length > 0) {
        imageUrl = statusData.data.image_urls[0];
        break;
      }

      if (statusData.data?.current_status === 'failed') {
        return NextResponse.json(
          { error: 'Storyboard generation failed: ' + (statusData.data?.failed_message || 'Unknown error') },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Storyboard generation timed out' },
        { status: 408 }
      );
    }

    // Save storyboard to database
    const { data: storyboard, error: dbError } = await supabase
      .from('storyboards')
      .insert({
        script_id: scriptId,
        scene_id: sceneId,
        image_url: imageUrl,
        description: description,
        shot_type: shotType || 'medium',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving storyboard:', dbError);
      return NextResponse.json(
        { error: 'Failed to save storyboard' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      storyboard,
      imageUrl,
    });
  } catch (error: any) {
    console.error('Storyboard generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Storyboard generation failed' },
      { status: 500 }
    );
  }
}

function buildStoryboardPrompt(description: string, shotType?: string): string {
  let prompt = `cinematic storyboard frame, ${description}`;
  
  if (shotType) {
    prompt += `, ${shotType} shot`;
  }
  
  prompt += ', professional storyboard style, black and white sketch, action film, high quality';
  
  return prompt;
}



