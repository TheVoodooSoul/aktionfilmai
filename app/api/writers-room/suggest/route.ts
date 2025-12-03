import { NextRequest, NextResponse } from 'next/server';

// Simple OpenAI streaming implementation

export async function POST(request: NextRequest) {
  try {
    const { script, action, context } = await request.json();

    if (!script) {
      return Response.json({ error: 'Script content is required' }, { status: 400 });
    }

    // Different prompts based on the action
    let prompt = '';
    
    switch (action) {
      case 'improve':
        prompt = `You are an expert action screenplay writer specializing in high-octane, cinematic action sequences. 
        
Analyze this script excerpt and provide specific improvements focused on:
1. Action choreography and pacing
2. Visual descriptions that enhance cinematography
3. Character tension and stakes
4. Dialogue that drives the action forward

Current script:
${script}

Provide your improved version maintaining the same format but with enhanced action writing:`;
        break;

      case 'suggest':
        prompt = `You are an expert action screenplay writer. Based on this script excerpt, suggest what should happen next in an exciting, cinematic way:

Current script:
${script}

Continue the scene with 3-5 lines of screenplay format that maintain high tension and visual excitement:`;
        break;

      case 'dialogue':
        prompt = `You are an expert action screenplay dialogue writer. Improve or add punchy, memorable dialogue to this scene:

${script}

Provide improved dialogue that feels authentic to action heroes - short, impactful, and memorable:`;
        break;

      case 'choreography':
        prompt = `You are a professional action choreographer. Describe detailed fight/action choreography for this scene:

${script}

Provide specific, cinematic action beats that would look amazing on screen:`;
        break;

      default:
        prompt = `You are an expert action screenplay writer. Help improve this script:

${script}

Provide suggestions to make it more cinematic and exciting:`;
    }

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Use OpenAI streaming API directly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert action screenplay writer specializing in cinematic action sequences, fight choreography, and tension-filled dialogue.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    });

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI suggestion' },
      { status: 500 }
    );
  }
}