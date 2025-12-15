import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { CREDIT_COSTS } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const { logline, genre, beats, draftNumber, userId } = await request.json();

    if (!beats || beats.length === 0) {
      return NextResponse.json({ error: 'Beats are required' }, { status: 400 });
    }

    // Check credits (costs more since it's a big generation)
    const cost = CREDIT_COSTS.WRITERS_ROOM_AI_SUGGESTION * 3; // 3x cost for full draft
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (!profile || profile.credits < cost) {
        return NextResponse.json(
          { error: 'Insufficient credits', credits_needed: cost },
          { status: 402 }
        );
      }

      await supabase
        .from('profiles')
        .update({ credits: profile.credits - cost })
        .eq('id', userId);

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: -cost,
          transaction_type: 'draft_generation',
          description: `Writers Room - Generate Draft #${draftNumber}`,
        });
    }

    // Build the beat summary for the AI
    const beatSummary = beats
      .filter((b: any) => b.content?.trim())
      .map((b: any) => `${b.name}: ${b.content}`)
      .join('\n\n');

    const prompt = `You are a professional action screenplay writer. Generate a rough first draft screenplay based on this structure.

LOGLINE: ${logline}
GENRE: ${genre}
DRAFT NUMBER: ${draftNumber}

STORY BEATS:
${beatSummary}

Write a rough screenplay draft in proper format:
- Scene headings (INT./EXT. LOCATION - TIME)
- Action lines (present tense, visual)
- Character names in CAPS for dialogue
- Minimal dialogue for now (placeholder lines are fine, mark with [DIALOGUE NEEDED])
- Focus on structure, pacing, and visual storytelling
- Include all major beats
- Aim for about 10-15 pages worth of content

Start with FADE IN: and structure it properly. This is Draft #${draftNumber} - keep it rough but complete.`;

    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert action screenplay writer. Write in proper screenplay format.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
        stream: true,
      }),
    });

    // Parse SSE stream
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
    console.error('Draft generation error:', error);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}
