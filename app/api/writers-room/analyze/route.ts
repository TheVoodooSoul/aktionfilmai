import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ScriptAnalysis, AnalysisSuggestion } from '@/lib/types';

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

    const { scriptId, scriptContent } = await req.json();

    if (!scriptId || !scriptContent) {
      return NextResponse.json(
        { error: 'Script ID and content are required' },
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

    // Analyze script content
    const analysis = await analyzeScript(scriptContent);

    // Save analysis to database
    const { error } = await supabase
      .from('script_analysis')
      .upsert({
        script_id: scriptId,
        readability: analysis.readability,
        pacing: analysis.pacing,
        action_density: analysis.actionDensity,
        dialogue_ratio: analysis.dialogueRatio,
        scene_count: analysis.sceneCount,
        average_scene_length: analysis.averageSceneLength,
        suggestions: analysis.suggestions,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving analysis:', error);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

async function analyzeScript(content: string): Promise<Omit<ScriptAnalysis, 'scriptId' | 'createdAt'>> {
  const lines = content.split('\n').filter(line => line.trim());
  const scenes = content.split(/INT\.|EXT\./i).length - 1;
  const dialogueLines = lines.filter(line => 
    line.trim().startsWith('CHARACTER:') || 
    line.match(/^[A-Z][A-Z\s]+:/)
  ).length;
  const actionLines = lines.length - dialogueLines;

  const readability = calculateReadability(content);
  const pacing = determinePacing(scenes, lines.length);
  const actionDensity = actionLines / lines.length;
  const dialogueRatio = dialogueLines / lines.length;
  const averageSceneLength = lines.length / Math.max(scenes, 1);

  const suggestions = generateSuggestions({
    scenes,
    dialogueRatio,
    actionDensity,
    readability,
  });

  return {
    readability,
    pacing,
    actionDensity,
    dialogueRatio,
    sceneCount: scenes,
    averageSceneLength,
    suggestions,
  };
}

function calculateReadability(content: string): number {
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / Math.max(sentences, 1);
  return Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 1.5)));
}

function determinePacing(scenes: number, totalLines: number): 'slow' | 'medium' | 'fast' {
  const linesPerScene = totalLines / Math.max(scenes, 1);
  if (linesPerScene > 50) return 'slow';
  if (linesPerScene < 20) return 'fast';
  return 'medium';
}

function generateSuggestions(metrics: any): AnalysisSuggestion[] {
  const suggestions: AnalysisSuggestion[] = [];
  
  if (metrics.dialogueRatio > 0.7) {
    suggestions.push({
      type: 'dialogue',
      severity: 'medium',
      message: 'High dialogue ratio. Consider adding more action beats.',
    });
  }
  
  if (metrics.actionDensity < 0.3) {
    suggestions.push({
      type: 'action',
      severity: 'high',
      message: 'Low action density. Action scripts benefit from more visual storytelling.',
    });
  }
  
  if (metrics.readability < 50) {
    suggestions.push({
      type: 'structure',
      severity: 'medium',
      message: 'Script may be difficult to read. Consider breaking up long paragraphs.',
    });
  }
  
  return suggestions;
}



