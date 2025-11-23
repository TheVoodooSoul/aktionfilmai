import { NextRequest, NextResponse } from 'next/server';

/**
 * Writers Room - AI Character Improv API
 * Generates in-character responses for improv sessions
 */
export async function POST(req: NextRequest) {
  try {
    const { characterName, characterDescription, conversationHistory, userMessage } = await req.json();

    console.log('Improv request:', {
      character: characterName,
      hasHistory: !!conversationHistory?.length,
      userMessage: userMessage?.substring(0, 50),
    });

    if (!characterName || !userMessage) {
      return NextResponse.json(
        { error: 'characterName and userMessage are required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const historyContext = conversationHistory
      ?.slice(-10) // Last 10 messages
      .map((msg: any) => `${msg.role === 'user' ? 'YOU' : characterName}: ${msg.content}`)
      .join('\n\n');

    // System prompt to keep AI in character
    const systemPrompt = `You are ${characterName}, ${characterDescription || 'an action movie character'}.

You are improvising a scene with a writer. Stay completely in character. Respond naturally, emotionally, and authentically as ${characterName} would.

Keep responses conversational and under 3 sentences. Don't break character or talk about being an AI.

This is an improv exercise to help discover authentic dialogue. Be bold, emotional, and truthful as ${characterName}.`;

    const conversationPrompt = historyContext
      ? `Previous conversation:\n${historyContext}\n\nYOU: ${userMessage}\n\n${characterName}:`
      : `YOU: ${userMessage}\n\n${characterName}:`;

    // Call OpenAI or Anthropic API
    // For now, using OpenAI as it's more common
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      // Fallback to simple response if no API key
      return NextResponse.json({
        reply: `(As ${characterName}) I hear you. Let's explore this scene together.`,
      });
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationPrompt },
        ],
        temperature: 0.9, // High creativity for improv
        max_tokens: 150,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      const reply = data.choices[0].message.content.trim();

      return NextResponse.json({
        reply,
        status: 'success',
      });
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('Improv API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate character response' },
      { status: 500 }
    );
  }
}
