import { streamText } from 'ai';
import { NextRequest } from 'next/server';

// Configure the AI provider with your API key
// You can use different providers: openai, anthropic, etc.
const createAIProvider = () => {
  // If you have an AI Gateway API key, you can use it here
  // Otherwise, fall back to OpenAI directly
  if (process.env.AI_GATEWAY_API_KEY) {
    // Using AI Gateway (supports multiple providers)
    return {
      apiKey: process.env.AI_GATEWAY_API_KEY,
      model: 'openai/gpt-4-turbo-preview'
    };
  } else if (process.env.OPENAI_API_KEY) {
    // Direct OpenAI integration
    return {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo-preview'
    };
  }
  throw new Error('No AI provider configured');
};

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

    // Stream the AI response
    const result = await streamText({
      model: createAIProvider().model,
      prompt,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Return the stream for real-time updates
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('AI suggestion error:', error);
    return Response.json(
      { error: 'Failed to generate AI suggestion' },
      { status: 500 }
    );
  }
}