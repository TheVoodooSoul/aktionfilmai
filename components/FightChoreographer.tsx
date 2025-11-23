'use client';

import { useState } from 'react';
import { Play, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import PresetBrowser from './PresetBrowser';

interface FightMove {
  id: string;
  preset: any;
  order: number;
}

interface FightChoreographerProps {
  character1?: { id: string; name: string; image_url: string };
  character2?: { id: string; name: string; image_url: string };
  onGenerate: (moves: FightMove[], characters: any[]) => void;
  onClose: () => void;
}

export default function FightChoreographer({
  character1,
  character2,
  onGenerate,
  onClose,
}: FightChoreographerProps) {
  const [timeline, setTimeline] = useState<FightMove[]>([]);
  const [showBrowser, setShowBrowser] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddMove = (preset: any) => {
    const newMove: FightMove = {
      id: `${preset.id}-${Date.now()}`,
      preset,
      order: timeline.length,
    };
    setTimeline([...timeline, newMove]);
  };

  const handleRemoveMove = (moveId: string) => {
    setTimeline(timeline.filter(m => m.id !== moveId).map((m, i) => ({ ...m, order: i })));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newTimeline = [...timeline];
    [newTimeline[index - 1], newTimeline[index]] = [newTimeline[index], newTimeline[index - 1]];
    setTimeline(newTimeline.map((m, i) => ({ ...m, order: i })));
  };

  const handleMoveDown = (index: number) => {
    if (index === timeline.length - 1) return;
    const newTimeline = [...timeline];
    [newTimeline[index], newTimeline[index + 1]] = [newTimeline[index + 1], newTimeline[index]];
    setTimeline(newTimeline.map((m, i) => ({ ...m, order: i })));
  };

  const handleGenerate = async () => {
    if (timeline.length === 0) {
      alert('Add at least one move to the timeline!');
      return;
    }

    if (!character1 && !character2) {
      alert('Select at least one character!');
      return;
    }

    setIsGenerating(true);
    const characters = [character1, character2].filter(Boolean);
    await onGenerate(timeline, characters);
    setIsGenerating(false);
  };

  const totalDuration = timeline.reduce((sum, move) => sum + (move.preset.preset_data?.duration || 3), 0);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex">
      {/* Left Sidebar - Preset Browser */}
      {showBrowser && (
        <div className="w-80 border-r border-zinc-800 flex flex-col">
          <PresetBrowser onSelectPreset={handleAddMove} />
        </div>
      )}

      {/* Main Area - Timeline */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Fight Choreographer</h1>
              <p className="text-sm text-zinc-500">Chain fight moves to create your action sequence</p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-2xl px-4 py-2"
            >
              ✕ Close
            </button>
          </div>

          {/* Character Display */}
          <div className="flex items-center gap-4">
            {character1 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                <img src={character1.image_url} alt={character1.name} className="w-8 h-8 rounded object-cover" />
                <span className="text-sm text-white">{character1.name}</span>
              </div>
            )}
            {character2 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                <img src={character2.image_url} alt={character2.name} className="w-8 h-8 rounded object-cover" />
                <span className="text-sm text-white">{character2.name}</span>
              </div>
            )}
            {!character1 && !character2 && (
              <div className="text-sm text-zinc-500">No characters selected</div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowBrowser(!showBrowser)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg transition-colors"
              >
                {showBrowser ? 'Hide' : 'Show'} Move Library
              </button>
              <div className="text-sm text-zinc-500">
                {timeline.length} moves · {totalDuration.toFixed(1)}s total
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || timeline.length === 0}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Fight Sequence
                </>
              )}
            </button>
          </div>

          {timeline.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🥋</div>
              <h2 className="text-2xl font-bold text-zinc-700 mb-2">Timeline Empty</h2>
              <p className="text-zinc-500">
                {showBrowser ? 'Select moves from the library to get started' : 'Show the library to add moves'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((move, index) => (
                <div
                  key={move.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-red-600 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Order Number */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-zinc-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} className="rotate-90" />
                      </button>
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === timeline.length - 1}
                        className="text-zinc-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={16} className="rotate-90" />
                      </button>
                    </div>

                    {/* Move Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-white">{move.preset.name}</h3>
                        <span className="text-sm text-zinc-500">{move.preset.preset_data?.duration?.toFixed(1)}s</span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-2">{move.preset.description}</p>
                      <div className="flex gap-2">
                        {move.preset.preset_data?.tags?.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleRemoveMove(move.id)}
                      className="text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
