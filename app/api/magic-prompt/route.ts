import { NextRequest, NextResponse } from 'next/server';

// Magic prompt enhancement using simple rules (no external API needed)
// Enhances prompts for cinematic action content

const actionEnhancements = {
  character: [
    'dramatic lighting',
    'cinematic portrait',
    'professional photography',
    'high detail',
    '8K quality',
    'sharp focus',
    'movie poster style',
  ],
  scene: [
    'cinematic action shot',
    'dramatic lighting',
    'motion blur',
    'dynamic composition',
    'epic scale',
    'high production value',
    'Hollywood blockbuster quality',
  ],
  sketch: [
    'cinematic style',
    'action movie aesthetic',
    'dramatic shadows',
    'high contrast',
    'professional quality',
    'detailed rendering',
  ],
  i2v: [
    'smooth motion',
    'cinematic camera movement',
    'dramatic action',
    'fluid animation',
    'high quality video',
    'professional production',
  ],
  lipsync: [
    // Dialogue enhancement - more expressive speech patterns
  ],
  default: [
    'cinematic quality',
    'high detail',
    'professional',
    '8K',
    'dramatic lighting',
    'action movie style',
  ],
};

// Dialogue enhancements for lipsync nodes
const dialogueEnhancements = {
  actionPhrases: [
    'Watch out!',
    'Behind you!',
    'Get down!',
    'Move it!',
    'Now!',
    'Go go go!',
  ],
  emotionalIntensifiers: [
    '(intense)',
    '(urgent)',
    '(determined)',
    '(fierce)',
    '(commanding)',
  ],
  breathMarks: ['...', '—', '!'],
};

const styleKeywords = {
  fight: ['intense combat', 'martial arts action', 'dynamic fighting poses', 'sweat and determination'],
  chase: ['high speed pursuit', 'motion blur', 'urban environment', 'desperate escape'],
  explosion: ['massive explosion', 'debris flying', 'fire and smoke', 'shockwave effects'],
  martial: ['precise strikes', 'fluid martial arts', 'traditional dojo aesthetic', 'discipline and power'],
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, nodeType } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    // Special handling for lipsync dialogue - enhance speech, not visual keywords
    if (nodeType === 'lipsync') {
      let enhancedDialogue = prompt.trim();

      // Add dramatic pauses if sentence is long and doesn't have them
      if (enhancedDialogue.length > 30 && !enhancedDialogue.includes('...') && !enhancedDialogue.includes('—')) {
        // Insert a dramatic pause at a natural break point
        const words = enhancedDialogue.split(' ');
        if (words.length > 5) {
          const midpoint = Math.floor(words.length / 2);
          words.splice(midpoint, 0, '...');
          enhancedDialogue = words.join(' ');
        }
      }

      // Add intensity if dialogue seems flat (no punctuation emphasis)
      if (!enhancedDialogue.includes('!') && !enhancedDialogue.includes('?')) {
        enhancedDialogue = enhancedDialogue.replace(/\.$/, '!');
      }

      // Capitalize for emphasis on short, urgent phrases
      if (enhancedDialogue.split(' ').length <= 4 && !enhancedDialogue.includes('!')) {
        enhancedDialogue = enhancedDialogue.toUpperCase() + '!';
      }

      console.log('Magic dialogue:', { original: prompt, enhanced: enhancedDialogue, nodeType });

      return NextResponse.json({
        enhancedPrompt: enhancedDialogue,
        original: prompt,
      });
    }

    // Get base enhancements for this node type (image/video nodes)
    const enhancements = actionEnhancements[nodeType as keyof typeof actionEnhancements] || actionEnhancements.default;

    // Detect style keywords and add relevant enhancements
    const promptLower = prompt.toLowerCase();
    let styleEnhance: string[] = [];

    for (const [key, values] of Object.entries(styleKeywords)) {
      if (promptLower.includes(key)) {
        styleEnhance = styleEnhance.concat(values.slice(0, 2));
      }
    }

    // Pick 3-4 random enhancements to avoid repetition
    const shuffled = [...enhancements].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    // Build enhanced prompt
    let enhancedPrompt = prompt.trim();

    // Remove any existing quality keywords to avoid duplication
    const existingQualityTerms = ['8k', '4k', 'hd', 'high quality', 'cinematic', 'professional'];
    const hasQuality = existingQualityTerms.some(term => promptLower.includes(term));

    // Add style enhancements if detected
    if (styleEnhance.length > 0) {
      enhancedPrompt += `, ${styleEnhance.join(', ')}`;
    }

    // Add general enhancements
    if (!hasQuality) {
      enhancedPrompt += `, ${selected.join(', ')}`;
    } else {
      // Still add some variety
      enhancedPrompt += `, ${selected.slice(0, 2).join(', ')}`;
    }

    // Clean up any double commas or spaces
    enhancedPrompt = enhancedPrompt.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();

    console.log('Magic prompt:', { original: prompt, enhanced: enhancedPrompt, nodeType });

    return NextResponse.json({
      enhancedPrompt,
      original: prompt,
    });
  } catch (error: any) {
    console.error('Magic prompt error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
