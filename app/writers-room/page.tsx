'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Save, Download, Users } from 'lucide-react';

export default function WritersRoomPage() {
  const [script, setScript] = useState('');
  const [title, setTitle] = useState('Untitled Script');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAISuggestion = async () => {
    setIsGenerating(true);
    // TODO: Integrate with OpenAI API for script improvements
    setTimeout(() => {
      setIsGenerating(false);
      alert('AI suggestion feature coming soon! Will use OpenAI API for script enhancement.');
    }, 1000);
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
              onClick={handleAISuggestion}
              disabled={isGenerating}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Sparkles size={16} />
              {isGenerating ? 'Thinking...' : 'AI Improve'}
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
        <div className="bg-zinc-900 rounded-lg p-6 min-h-[600px] border border-zinc-800">
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full h-full bg-transparent text-white font-mono text-lg resize-none outline-none"
            placeholder="INT. ABANDONED WAREHOUSE - NIGHT

Our hero walks into the dark warehouse, fists clenched...

Start writing your action script here. The AI will learn your style and help improve your writing over time."
            style={{ minHeight: '600px' }}
          />
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="text-red-500" size={18} />
            AI-Powered Writing Assistant
          </h3>
          <p className="text-sm text-zinc-400">
            The Writers Room AI learns from your writing style and provides intelligent suggestions to improve your action scripts.
            Integrates with OpenAI for advanced script analysis and enhancement. (Coming soon with OpenAI API integration)
          </p>
        </div>
      </div>
    </div>
  );
}
