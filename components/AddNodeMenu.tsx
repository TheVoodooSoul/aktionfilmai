'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddNodeMenuProps {
  onAddNode: (type: 'scene' | 'sketch' | 'i2i' | 't2i' | 'i2v' | 'v2v' | 't2v' | 'text2video' | 'lipsync' | 'talking-photo' | 'face-swap' | 'action-pose' | 'coherent-scene' | 'wan-i2v' | 'wan-vace' | 'wan-first-last' | 'wan-animate' | 'wan-fast' | 'wan-t2v' | 'nanobanana' | 'atlas-i2v' | 'atlas-t2v' | 'atlas-v2v' | 'atlas-animate' | 'atlas-extend') => void;
}

export default function AddNodeMenu({ onAddNode }: AddNodeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const nodeTypes = [
    // === DRAWING & IMAGES ===
    { type: 't2i' as const, icon: '✨', label: 'Text to Image', description: 'Use @name to tag your avatar (A2E - 2 credits)', category: 'image' },
    { type: 'sketch' as const, icon: '✏️', label: 'Sketch to Image', description: 'Draw and convert (Replicate - 1 credit)', category: 'image' },
    { type: 'i2i' as const, icon: '🖼️', label: 'Image to Image', description: 'Transform image (A2E - 2 credits)', category: 'image' },

    // === A2E VIDEO ===
    { type: 'text2video' as const, icon: '📝', label: 'Text to Video', description: 'Prompt → video, use @name (A2E - 80 credits)', category: 'a2e' },
    { type: 'i2v' as const, icon: '🎬', label: 'Image to Video', description: '5-sec 720p Wan (A2E - 100 credits)', category: 'a2e' },
    { type: 'v2v' as const, icon: '🔁', label: 'Video to Video', description: 'Transform video (A2E - 120 credits)', category: 'a2e' },
    { type: 't2v' as const, icon: '🎤', label: 'Talking Portrait', description: 'Avatar speaks text (A2E - 50 credits)', category: 'a2e' },
    { type: 'nanobanana' as const, icon: '🍌', label: 'NanoBanana', description: 'Multi-character scene (A2E - 3 credits)', category: 'a2e' },
    { type: 'lipsync' as const, icon: '🗣️', label: 'Lipsync', description: 'Add dialogue to video (A2E - 3 credits)', category: 'a2e' },
    { type: 'talking-photo' as const, icon: '📸', label: 'Talking Photo', description: 'Photo speaks (A2E - 5 credits)', category: 'a2e' },
    { type: 'face-swap' as const, icon: '🔄', label: 'Face Swap', description: 'Swap faces (A2E - 5 credits)', category: 'a2e' },

    // === WAN DIRECT (Replicate) ===
    { type: 'wan-t2v' as const, icon: '📝', label: 'Wan Text to Video', description: 'Text prompt → video (40 credits)', category: 'wan' },
    { type: 'wan-i2v' as const, icon: '🎥', label: 'Wan 2.5 I2V', description: 'Image → video (80 credits)', category: 'wan' },
    { type: 'wan-fast' as const, icon: '⚡', label: 'Wan Fast', description: 'Quick preview video (30 credits)', category: 'wan' },
    { type: 'wan-first-last' as const, icon: '🔗', label: 'Wan First-Last', description: 'Interpolate 2 frames (60 credits)', category: 'wan' },
    { type: 'wan-animate' as const, icon: '🏃', label: 'Wan Animate', description: 'Animate character (70 credits)', category: 'wan' },
    { type: 'wan-vace' as const, icon: '🎨', label: 'Wan VACE', description: 'Video edit w/ refs (50 credits)', category: 'wan' },

    // === ATLASCLOUD SPICY (uncensored action) ===
    { type: 'atlas-i2v' as const, icon: '🔥', label: 'Spicy I2V', description: 'Uncensored action video (45 credits)', category: 'spicy' },
    { type: 'atlas-t2v' as const, icon: '🌶️', label: 'Spicy T2V', description: 'Action text→video (50 credits)', category: 'spicy' },
    { type: 'atlas-v2v' as const, icon: '💥', label: 'Spicy V2V', description: 'Transform action video (60 credits)', category: 'spicy' },
    { type: 'atlas-animate' as const, icon: '⚔️', label: 'Spicy Animate', description: 'Fight animation (55 credits)', category: 'spicy' },
    { type: 'atlas-extend' as const, icon: '➕', label: 'Spicy Extend', description: 'Extend action scene (40 credits)', category: 'spicy' },

    // === ACTION & SCENES ===
    { type: 'scene' as const, icon: '🎭', label: 'Scene Builder', description: 'Action scene (A2E - 3 credits)', category: 'scene' },
    { type: 'action-pose' as const, icon: '🥋', label: 'Action Pose', description: 'Fighting pose (Fal - 2 credits)', category: 'scene' },
    { type: 'coherent-scene' as const, icon: '🎞️', label: 'Coherent Scene', description: '6 images → scene (10 credits, 15min)', category: 'scene' },
  ];

  const categories = [
    { id: 'image', label: 'Images', color: 'text-blue-400' },
    { id: 'a2e', label: 'A2E Video', color: 'text-green-400' },
    { id: 'wan', label: 'Wan Direct', color: 'text-purple-400' },
    { id: 'spicy', label: '🔥 Spicy (Uncensored)', color: 'text-red-500' },
    { id: 'scene', label: 'Scenes', color: 'text-orange-400' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      {isOpen && (
        <div className="mb-4 bg-[#1a1a1a] border border-zinc-800 rounded-xl shadow-2xl p-3 min-w-[320px] max-h-[70vh] overflow-y-auto">
          {categories.map((category) => (
            <div key={category.id} className="mb-3">
              <div className={`text-xs font-bold uppercase tracking-wider ${category.color} mb-2 px-2`}>
                {category.label}
              </div>
              <div className="space-y-1">
                {nodeTypes
                  .filter((node) => node.category === category.id)
                  .map((nodeType) => (
                    <button
                      key={nodeType.type}
                      onClick={() => {
                        onAddNode(nodeType.type);
                        setIsOpen(false);
                      }}
                      className="w-full px-3 py-2.5 bg-black hover:bg-zinc-900 rounded-lg flex items-center gap-3 transition-colors text-left group"
                    >
                      <span className="text-xl">{nodeType.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white group-hover:text-red-500 transition-colors">
                          {nodeType.label}
                        </div>
                        <div className="text-xs text-zinc-500">{nodeType.description}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
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
