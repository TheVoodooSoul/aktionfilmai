import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhance Prompt API
 * Enhances a basic prompt into a more detailed, cinematic description for action scenes
 * Uses rule-based enhancement for fast, reliable results without external API calls
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, style, context } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Style-specific descriptors
    const styleDescriptors: Record<string, string[]> = {
      realistic: [
        'photorealistic',
        'highly detailed',
        '8k resolution',
        'professional photography',
        'sharp focus',
      ],
      anime: [
        'anime style',
        'detailed anime art',
        'vibrant colors',
        'dynamic action lines',
        'dramatic shading',
      ],
      comic: [
        'comic book style',
        'bold outlines',
        'dramatic inking',
        'halftone shading',
        'action panel composition',
      ],
      sketch: [
        'detailed pencil sketch',
        'professional storyboard',
        'dynamic line work',
        'expressive shading',
        'concept art style',
      ],
    };

    // Action scene enhancements
    const actionEnhancements = [
      'cinematic composition',
      'dramatic lighting',
      'dynamic action pose',
      'motion blur effects',
      'intense atmosphere',
      'professional fight choreography',
    ];

    // Camera angle suggestions based on content
    const cameraAngles = [
      'low angle shot',
      'dramatic perspective',
      'wide angle lens',
    ];

    // Environmental effects for action
    const envEffects = [
      'atmospheric dust particles',
      'sparks flying',
      'debris in motion',
      'dramatic shadows',
    ];

    // Build enhanced prompt
    let enhancedPrompt = prompt.trim();

    // Get style descriptors
    const selectedStyle = style || 'realistic';
    const styleWords = styleDescriptors[selectedStyle] || styleDescriptors.realistic;

    // Add action enhancements for action scenes
    if (context === 'action_scene') {
      // Pick 2-3 random action enhancements
      const shuffledAction = [...actionEnhancements].sort(() => Math.random() - 0.5);
      const selectedAction = shuffledAction.slice(0, 3);

      // Pick a camera angle
      const cameraAngle = cameraAngles[Math.floor(Math.random() * cameraAngles.length)];

      // Pick 1-2 environmental effects
      const shuffledEnv = [...envEffects].sort(() => Math.random() - 0.5);
      const selectedEnv = shuffledEnv.slice(0, 2);

      // Construct enhanced prompt
      enhancedPrompt = `${enhancedPrompt}, ${selectedAction.join(', ')}, ${cameraAngle}, ${selectedEnv.join(', ')}, ${styleWords.slice(0, 3).join(', ')}, masterpiece quality, award-winning cinematography`;
    } else {
      // Generic enhancement
      enhancedPrompt = `${enhancedPrompt}, ${styleWords.join(', ')}, masterpiece quality, detailed composition`;
    }

    // Clean up any double commas or trailing commas
    enhancedPrompt = enhancedPrompt
      .replace(/,\s*,/g, ',')
      .replace(/,\s*$/, '')
      .trim();

    return NextResponse.json({
      enhanced_prompt: enhancedPrompt,
      original_prompt: prompt,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Enhance prompt error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
