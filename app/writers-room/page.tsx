'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Save, Download, Users, Coins, Home, PenTool, MessageSquare, Film, Wand2, BookOpen } from 'lucide-react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

// Screenplay element types
type ElementType = 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';

// Auto-formatting helpers
const formatScreenplayLine = (line: string, prevLine: string): { text: string; type: ElementType } => {
  const trimmed = line.trim();
  const prevTrimmed = prevLine.trim();

  // Scene headings: INT./EXT. - auto capitalize
  if (/^(int\.?|ext\.?|int\.?\/ext\.?|i\/e\.?)\s/i.test(trimmed)) {
    return { text: trimmed.toUpperCase(), type: 'scene-heading' };
  }

  // Transitions: CUT TO, FADE OUT, etc. - auto capitalize
  if (/^(cut to|fade out|fade in|dissolve to|smash cut|match cut|jump cut|time cut)[\s:]*$/i.test(trimmed)) {
    return { text: trimmed.toUpperCase() + (trimmed.includes(':') ? '' : ':'), type: 'transition' };
  }

  // Character name detection: ALL CAPS line that's not a scene heading
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && !/^(INT|EXT|FADE|CUT|DISSOLVE)/.test(trimmed)) {
    // Check if it looks like a character name (letters, maybe with parenthetical like (V.O.) or (O.S.))
    if (/^[A-Z][A-Z\s]+(\s*\([A-Z.]+\))?$/.test(trimmed)) {
      return { text: trimmed, type: 'character' };
    }
  }

  // Dialogue: after a character name
  if (prevTrimmed && /^[A-Z][A-Z\s]+(\s*\([A-Z.]+\))?$/.test(prevTrimmed)) {
    // Parenthetical
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return { text: trimmed.toLowerCase(), type: 'parenthetical' };
    }
    return { text: trimmed, type: 'dialogue' };
  }

  // Default: action line
  return { text: trimmed, type: 'action' };
};

export default function WritersRoomPage() {
  const { user, credits, setCredits } = useStore();
  const [script, setScript] = useState('');
  const [title, setTitle] = useState('Untitled Script');
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Load user credits on mount
  useEffect(() => {
    if (user?.id) {
      loadUserCredits();
    }
  }, [user]);

  const loadUserCredits = async () => {
    if (!user?.id) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      setCredits(profile.credits);
    }
  };

  // Handle Enter key for auto-formatting
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!autoFormat) return;

    const textarea = e.currentTarget;
    const { selectionStart, value } = textarea;

    // Get current line
    const beforeCursor = value.substring(0, selectionStart);
    const lines = beforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    const prevLine = lines.length > 1 ? lines[lines.length - 2] : '';

    // On Enter: format the current line before moving to next
    if (e.key === 'Enter' && !e.shiftKey) {
      const formatted = formatScreenplayLine(currentLine, prevLine);

      // Only format if the line changed
      if (formatted.text !== currentLine && currentLine.trim()) {
        e.preventDefault();

        // Calculate indentation for next line based on element type
        let indent = '';
        if (formatted.type === 'character') {
          // After character name, next line is dialogue - indent it
          indent = '          '; // 10 spaces for dialogue
        } else if (formatted.type === 'dialogue' || formatted.type === 'parenthetical') {
          // Keep dialogue indent
          indent = '          ';
        } else if (formatted.type === 'transition') {
          // Transitions go to right side
          indent = '';
        }

        // Replace current line with formatted version
        const lineStart = beforeCursor.lastIndexOf('\n') + 1;
        const afterCursor = value.substring(selectionStart);

        // For character names, center them (add leading spaces)
        let formattedLine = formatted.text;
        if (formatted.type === 'character') {
          formattedLine = '                    ' + formatted.text; // 20 spaces to center
        } else if (formatted.type === 'transition') {
          formattedLine = '                                        ' + formatted.text; // 40 spaces to right-align
        }

        const newValue = value.substring(0, lineStart) + formattedLine + '\n' + indent + afterCursor;
        setScript(newValue);

        // Set cursor position after indent on new line
        setTimeout(() => {
          const newPos = lineStart + formattedLine.length + 1 + indent.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
        return;
      }
    }

    // Tab key: insert dialogue indent
    if (e.key === 'Tab') {
      e.preventDefault();
      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionStart);
      const indent = '          '; // 10 spaces
      setScript(beforeCursor + indent + afterCursor);
      setTimeout(() => {
        textarea.setSelectionRange(selectionStart + indent.length, selectionStart + indent.length);
      }, 0);
    }
  }, [autoFormat]);

  // Handle script change with live auto-formatting for specific patterns
  const handleScriptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    if (autoFormat) {
      // Auto-capitalize scene headings as user types
      const lines = newValue.split('\n');
      const lastLine = lines[lines.length - 1];

      // If typing INT. or EXT. at start of line, capitalize
      if (/^(int|ext|int\/ext|i\/e)\.\s$/i.test(lastLine)) {
        lines[lines.length - 1] = lastLine.toUpperCase();
        newValue = lines.join('\n');
      }
    }

    setScript(newValue);
  }, [autoFormat]);

  const handleAISuggestion = async (action = 'improve') => {
    if (!script.trim()) {
      alert('Please write some script content first!');
      return;
    }

    setIsGenerating(true);
    setShowSuggestion(false);
    
    try {
      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: script.slice(-1000), // Send last 1000 chars for context
          action 
        }),
      });

      if (!response.ok) throw new Error('Failed to get suggestion');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let suggestion = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          suggestion += text;
          setAiSuggestion(suggestion);
          setShowSuggestion(true);
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      alert('Failed to get AI suggestion. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left: Navigation */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              <Home size={20} />
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              WRITERS ROOM
            </h1>
          </div>

          {/* Center: Mode Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <Link
              href="/writers-room/structure"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <BookOpen size={14} />
              Structure
            </Link>
            <Link
              href="/writers-room/characters"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Users size={14} />
              Characters
            </Link>
            <Link
              href="/writers-room/scenes"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Film size={14} />
              Scenes
            </Link>
            <div className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium flex items-center gap-2">
              <PenTool size={14} />
              Script
            </div>
            <Link
              href="/writers-room/improv"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <MessageSquare size={14} />
              Improv
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm mr-2">
                <Coins size={14} className="text-yellow-500" />
                <span className="text-white font-medium">{credits || 0}</span>
              </div>
            )}
            <button
              onClick={() => handleAISuggestion('improve')}
              disabled={isGenerating}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} />
              {isGenerating ? 'Thinking...' : 'AI Improve'}
            </button>
            <button
              onClick={() => handleAISuggestion('suggest')}
              disabled={isGenerating}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} />
              Continue Scene
            </button>
            <button
              onClick={() => handleAISuggestion('choreography')}
              disabled={isGenerating}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} />
              Add Action
            </button>
            <button
              onClick={() => setAutoFormat(!autoFormat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                autoFormat
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
              }`}
              title="Toggle auto-formatting (scene headings, character names, dialogue)"
            >
              <Wand2 size={16} />
              Auto-Format {autoFormat ? 'ON' : 'OFF'}
            </button>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Save size={16} />
              Save
            </button>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Script Editor - Full Width */}
        <div className={`flex-1 flex flex-col ${showSuggestion ? 'max-w-[60%]' : ''}`}>
          <div className="p-6 flex-1 flex flex-col">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-3xl font-bold mb-4 border-none outline-none text-white placeholder-zinc-700 text-center"
              placeholder="UNTITLED SCREENPLAY"
            />
            <div className="text-center text-xs text-zinc-600 mb-6">Written by [Author Name]</div>

            {/* Screenplay Editor */}
            <div className="flex-1 bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
              <div className="screenplay-editor h-full">
                <textarea
                  ref={textareaRef}
                  value={script}
                  onChange={handleScriptChange}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full bg-transparent text-white resize-none outline-none p-8 screenplay-text"
                  placeholder={`FADE IN:

INT. ABANDONED WAREHOUSE - NIGHT

Moonlight cuts through broken windows. Dust particles float in the air.

JAKE (35, scarred, dangerous) steps through the doorway. His footsteps echo.

                    JAKE
          I know you're here.

A SHADOW moves in the darkness. VICTOR (40, cold, calculating) emerges from behind a stack of crates.

                    VICTOR
          You shouldn't have come alone.

Jake cracks his knuckles.

                    JAKE
          Who says I'm alone?

CRASH! The skylight SHATTERS—


[Start writing your screenplay here. Use standard format:
 - Scene headings: INT./EXT. LOCATION - TIME
 - Action lines: Describe what we see
 - Character names: CENTERED AND CAPS
 - Dialogue: Indented under character name
 - Parentheticals: (emotions/actions)]`}
                  style={{
                    minHeight: 'calc(100vh - 280px)',
                    fontFamily: 'var(--font-courier-prime), Courier New, monospace',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    tabSize: 4,
                  }}
                />
              </div>
            </div>

            {/* Formatting Help */}
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">
              <div className="flex items-center gap-4">
                <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Tab</kbd> Dialogue indent</span>
                <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Enter</kbd> Auto-format line</span>
                {autoFormat && (
                  <>
                    <span className="text-green-500">INT./EXT. → caps</span>
                    <span className="text-green-500">CHARACTER → centered</span>
                    <span className="text-green-500">CUT TO → right-aligned</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>{script.length} chars</span>
                <span>~{Math.ceil(script.split('\n').filter(l => l.trim()).length / 55)} pages</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestion Panel - Side Panel */}
        {showSuggestion && (
          <div className="w-[40%] border-l border-zinc-800 bg-zinc-900 flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold text-red-500 flex items-center gap-2">
                <Sparkles size={16} />
                AI Suggestion
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setScript(script + '\n\n' + aiSuggestion);
                    setShowSuggestion(false);
                    setAiSuggestion('');
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={() => {
                    setShowSuggestion(false);
                    setAiSuggestion('');
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div
                className="text-white whitespace-pre-wrap"
                style={{
                  fontFamily: 'var(--font-courier-prime), Courier New, monospace',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}
              >
                {aiSuggestion}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar - Credits Info */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              AI Suggestions: 1 credit
            </span>
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              Improv: 1 credit/message
            </span>
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              Storyboard: 2 credits/frame
            </span>
          </div>
          <span className="text-zinc-600">Courier Prime font for industry-standard formatting</span>
        </div>
      </div>
    </div>
  );
}
