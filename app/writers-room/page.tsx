'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Save, Download, Users, Coins } from 'lucide-react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function WritersRoomPage() {
  const { user, credits, setCredits } = useStore();
  const [script, setScript] = useState('');
  const [title, setTitle] = useState('Untitled Script');
  const [isGenerating, setIsGenerating] = useState(false);

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
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              WRITERS ROOM
            </h1>
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-sm">
                <Coins size={16} className="text-yellow-500" />
                <span className="text-white font-medium">{credits || 0}</span>
                <span className="text-zinc-500">credits</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/writers-room/improv"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Users size={16} />
              Improv Session
            </Link>
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

      <div className="max-w-5xl mx-auto p-8">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-4xl font-bold mb-8 border-none outline-none text-white placeholder-zinc-700"
          placeholder="Script Title..."
        />

        {/* Script Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 rounded-lg p-6 min-h-[600px] border border-zinc-800">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-full bg-transparent text-white font-mono text-lg resize-vertical outline-none leading-relaxed p-4"
              placeholder="INT. ABANDONED WAREHOUSE - NIGHT

Our hero walks into the dark warehouse, fists clenched...

Start writing your action script here. The AI will learn your style and help improve your writing over time."
              style={{ minHeight: '700px' }}
            />
          </div>
          
          {/* AI Suggestion Panel */}
          {showSuggestion && (
            <div className="bg-zinc-900 rounded-lg p-6 min-h-[600px] border border-red-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-500">AI Suggestion</h3>
                <button
                  onClick={() => {
                    setScript(script + '\n\n' + aiSuggestion);
                    setShowSuggestion(false);
                    setAiSuggestion('');
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
                >
                  Apply to Script
                </button>
              </div>
              <div className="text-white font-mono text-lg whitespace-pre-wrap">
                {aiSuggestion}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="text-red-500" size={18} />
            AI-Powered Writing Assistant
          </h3>
          <p className="text-sm text-zinc-400">
            The Writers Room AI learns from your writing style and provides intelligent suggestions to improve your action scripts.
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              AI Suggestions: 1 credit
            </span>
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              Improv Session: FREE during beta
            </span>
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              Performance Videos: 5 credits
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
