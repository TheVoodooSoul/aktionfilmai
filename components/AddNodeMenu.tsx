'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddNodeMenuProps {
  onAddNode: (type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 't2v' | 'lipsync') => void;
}

export default function AddNodeMenu({ onAddNode }: AddNodeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const nodeTypes = [
    { type: 'character' as const, icon: '👤', label: 'Character', description: 'Generate uncensored character (A2E)' },
    { type: 'scene' as const, icon: '🎭', label: 'Scene Builder', description: 'Compose action scene (RunPod)' },
    { type: 'sketch' as const, icon: '✏️', label: 'Sketch to Image', description: 'Draw and convert to image' },
    { type: 'i2i' as const, icon: '🖼️', label: 'Image to Image', description: 'Transform existing image' },
    { type: 't2i' as const, icon: '✨', label: 'Text to Image', description: 'Generate from description' },
    { type: 't2v' as const, icon: '🎬', label: 'Image to Video', description: 'Create video (A2E Wan 2.5)' },
    { type: 'lipsync' as const, icon: '🗣️', label: 'Lipsync', description: 'Add dialogue to character (A2E)' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      {isOpen && (
        <div className="mb-4 bg-[#1a1a1a] border border-zinc-800 rounded-xl shadow-2xl p-2 min-w-[280px]">
          <div className="space-y-1">
            {nodeTypes.map((nodeType) => (
              <button
                key={nodeType.type}
                onClick={() => {
                  onAddNode(nodeType.type);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 bg-black hover:bg-zinc-900 rounded-lg flex items-center gap-3 transition-colors text-left group"
              >
                <span className="text-2xl">{nodeType.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white group-hover:text-red-500 transition-colors">
                    {nodeType.label}
                  </div>
                  <div className="text-xs text-zinc-600">{nodeType.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 hover:bg-red-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-red-500/50 transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
