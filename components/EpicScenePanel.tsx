'use client';

import { useState } from 'react';
import { X, Upload, AlertTriangle, Crown, Zap } from 'lucide-react';

type ModelType = 'standard' | 'kling';

interface EpicScenePanelProps {
  onGenerate: (images: string[], model?: ModelType, prompt?: string) => void;
  isGenerating: boolean;
}

export default function EpicScenePanel({ onGenerate, isGenerating }: EpicScenePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>(Array(6).fill(''));
  const [selectedModel, setSelectedModel] = useState<ModelType>('standard');
  const [prompt, setPrompt] = useState('');

  const handleImageUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    const filledImages = images.filter(img => img);
    const minImages = selectedModel === 'kling' ? 2 : 6;
    const maxImages = selectedModel === 'kling' ? 4 : 6;

    if (filledImages.length < minImages) {
      alert(`⚠️ Please upload at least ${minImages} images!`);
      return;
    }
    if (selectedModel === 'kling' && !prompt) {
      alert('⚠️ Kling requires a prompt describing the scene!');
      return;
    }
    onGenerate(filledImages, selectedModel, prompt);
  };

  const getCredits = () => selectedModel === 'kling' ? 8 : 10;
  const getTime = () => selectedModel === 'kling' ? '2-5 min' : '10-15 min';

  return (
    <>
      {/* Epic Scene Button - Fixed at bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-8 z-40 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-red-500/50 transition-all hover:scale-110 active:scale-95 flex items-center gap-2 font-bold"
      >
        🎞️ EPIC SCENE
      </button>

      {/* Epic Scene Panel */}
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-[#1a1a1a] border-t-4 border-red-600 shadow-2xl transform transition-transform duration-300">
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span className="text-3xl">🎞️</span>
                  EPIC SCENE GENERATOR
                </h2>
                <p className="text-sm text-zinc-400 mt-1">Upload 6 images to create a coherent action scene</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Model Selector */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSelectedModel('standard')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedModel === 'standard'
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className={selectedModel === 'standard' ? 'text-red-500' : 'text-zinc-500'} size={24} />
                  <div className="text-left">
                    <div className="text-white font-bold">Standard</div>
                    <div className="text-xs text-zinc-400">6 images • 10-15 min • 10 credits</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setSelectedModel('kling')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedModel === 'kling'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Crown className={selectedModel === 'kling' ? 'text-purple-500' : 'text-zinc-500'} size={24} />
                  <div className="text-left">
                    <div className="text-white font-bold flex items-center gap-2">
                      KLING Premium
                      <span className="text-[10px] bg-purple-600 px-2 py-0.5 rounded">NEW</span>
                    </div>
                    <div className="text-xs text-zinc-400">2-4 images • 2-5 min • 8 credits</div>
                  </div>
                </div>
              </button>
            </div>

            {/* BETA Disclaimer */}
            <div className={`border rounded-lg p-4 mb-6 flex items-start gap-3 ${
              selectedModel === 'kling'
                ? 'bg-purple-900/20 border-purple-600/50'
                : 'bg-yellow-900/20 border-yellow-600/50'
            }`}>
              <AlertTriangle className={selectedModel === 'kling' ? 'text-purple-500' : 'text-yellow-500'} size={20} />
              <div className="text-sm">
                <p className={`font-bold mb-1 ${selectedModel === 'kling' ? 'text-purple-200' : 'text-yellow-200'}`}>
                  {selectedModel === 'kling' ? '👑 KLING PREMIUM MODEL' : '⚠️ THIS IS STILL IN BETA'}
                </p>
                <p className={selectedModel === 'kling' ? 'text-purple-300/80' : 'text-yellow-300/80'}>
                  {selectedModel === 'kling'
                    ? 'Kling v1.6 multi-reference. Upload 2-4 character images and describe your scene. Best for cinematic action shots!'
                    : `Perfect results are not guaranteed. Generation takes ${getTime()}. This feature costs ${getCredits()} credits.`
                  }
                </p>
                {selectedModel === 'kling' && (
                  <p className="text-yellow-400/90 mt-2 text-xs flex items-center gap-1">
                    <span className="text-yellow-500">⚠️</span>
                    <strong>Content Policy:</strong> Kling does not allow violent or harmful content. Use for dramatic, non-violent scenes.
                  </p>
                )}
              </div>
            </div>

            {/* Kling Prompt Input */}
            {selectedModel === 'kling' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Scene Description</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the cinematic action scene... e.g., 'Two warriors clash swords in an epic battle, sparks flying, dramatic lighting, 8K cinematic'"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Image Upload Grid - Dynamic based on model */}
            <div className={`grid gap-4 mb-6 ${
              selectedModel === 'kling'
                ? 'grid-cols-2 md:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
            }`}>
              {(selectedModel === 'kling' ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5]).map((index) => (
                <div key={index} className="relative">
                  <div className={`aspect-square bg-black border-2 rounded-lg overflow-hidden transition-colors ${
                    selectedModel === 'kling'
                      ? 'border-purple-800 hover:border-purple-600'
                      : 'border-zinc-800 hover:border-red-600'
                  }`}>
                    {images[index] ? (
                      <img
                        src={images[index]}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                        <Upload size={32} className="mb-2" />
                        <span className="text-xs">
                          {selectedModel === 'kling'
                            ? (index < 2 ? `Ref ${index + 1} *` : `Ref ${index + 1}`)
                            : `Image ${index + 1}`
                          }
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(index, file);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className={`absolute top-2 left-2 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    selectedModel === 'kling' ? 'bg-purple-600' : 'bg-red-600'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (selectedModel === 'kling'
                ? images.filter(img => img).length < 2 || !prompt
                : images.filter(img => img).length !== 6
              )}
              className={`w-full px-6 py-4 font-black text-lg rounded-lg transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                selectedModel === 'kling'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-zinc-800 disabled:to-zinc-900'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-zinc-800 disabled:to-zinc-900'
              } text-white`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {selectedModel === 'kling' ? 'GENERATING WITH KLING...' : 'GENERATING EPIC SCENE...'} ({getTime()})
                </>
              ) : (
                <>
                  {selectedModel === 'kling' ? '👑 GENERATE WITH KLING' : '🎬 GENERATE EPIC SCENE'}
                  <span className="text-sm opacity-75">({getCredits()} credits)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
