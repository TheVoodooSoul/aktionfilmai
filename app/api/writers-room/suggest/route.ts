import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CREDIT_COSTS } from '@/lib/credits';

// Simple OpenAI streaming implementation

export async function POST(request: NextRequest) {
  try {
    const { script, action, context, userId } = await request.json();

    if (!script) {
      return Response.json({ error: 'Script content is required' }, { status: 400 });
    }

    // Check and deduct credits (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < CREDIT_COSTS.WRITERS_ROOM_AI_SUGGESTION) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            message: `AI suggestions cost ${CREDIT_COSTS.WRITERS_ROOM_AI_SUGGESTION} credit.`,
            credits_needed: CREDIT_COSTS.WRITERS_ROOM_AI_SUGGESTION,
          },
          { status: 402 }
        );
      }

      // Deduct credits
      await supabase
        .from('profiles')
        .update({ credits: profile.credits - CREDIT_COSTS.WRITERS_ROOM_AI_SUGGESTION })
        .eq('id', userId);

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -CREDIT_COSTS.WRITERS_ROOM_AI_SUGGESTION,
          transaction_type: 'ai_suggestion',
          description: `Writers Room - AI ${action || 'improve'}`,
        });
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

      case 'logline':
        prompt = `You're a logline specialist helping a screenwriter craft a killer logline. They've shared:

${script}

Help them strengthen it! Offer 3 different angles:

1. **Tighten the hook** - Make the core conflict pop in fewer words
2. **Raise the stakes** - What makes us NEED to see this story?
3. **Character lens** - Focus on who the protagonist is and their flaw/goal

Keep each suggestion to 1-2 sentences max. Be specific to THEIR story. End with "What feels closest to your vision?" to keep the conversation going.`;
        break;

      case 'beat':
        prompt = `You're a writing partner brainstorming with a fellow screenwriter. They're working on this beat for their action screenplay:

${script}

Instead of writing it FOR them, offer 3 SHORT different directions they could take this beat. Format it like a casual brainstorm:

"What if..." followed by a punchy 1-2 sentence idea.

Keep each idea distinct - maybe one is more character-focused, one more action-driven, one with a twist. Be specific to THEIR story, not generic. Talk like a collaborator, not an AI assistant. End with "Which direction speaks to you?" or similar to invite discussion.`;
        break;

      case 'riff':
        prompt = `You're a writing partner having a conversation with a screenwriter. They just said:

"${script}"

IMPORTANT: Actually respond to what they said! If they asked a question, ANSWER it directly. If they picked an option, build on THAT specific choice. If they shared an idea, react to THAT idea.

Do NOT generate new random ideas. Have an actual conversation:
- If they ask "what if X?" - respond to X specifically
- If they say "I like option 2" - great, dig deeper into option 2
- If they ask "how would that work?" - explain how it would work

Keep it conversational, 2-3 sentences. End with a follow-up question to keep the dialogue going.`;
        break;

      case 'storyboard':
        // Special case: return structured JSON for storyboard frames (non-streaming)
        const storyboardResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert storyboard artist and cinematographer. Break down scripts into visual storyboard frames.

Return ONLY a valid JSON array with 4-8 frames. Each frame must have:
- description: A vivid visual description for image generation (be specific about composition, lighting, characters)
- shotType: One of: wide, medium, close, extreme-close, over-shoulder, low-angle, high-angle, dutch
- notes: Brief director notes (optional)

Example format:
[
  {"description": "Dark warehouse interior, single overhead light illuminating a figure in a leather jacket standing center frame, shadows stretching behind", "shotType": "wide", "notes": "Establish mood and location"},
  {"description": "Close-up of protagonist's face, sweat glistening, eyes focused and determined, shallow depth of field", "shotType": "close", "notes": "Show resolve"}
]`
              },
              {
                role: 'user',
                content: `Break down this script/scene into storyboard frames:\n\n${script}`
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" },
          }),
        });

        const storyboardData = await storyboardResponse.json();
        const content = storyboardData.choices?.[0]?.message?.content;

        try {
          const parsed = JSON.parse(content);
          const frames = parsed.frames || parsed;
          return NextResponse.json({ frames: Array.isArray(frames) ? frames : [] });
        } catch {
          return NextResponse.json({ frames: [], error: 'Failed to parse AI response' });
        }

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

    // Parse SSE stream and extract only the content
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
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