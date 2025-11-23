'use client';

import { useState } from 'react';
import { X, Upload, AlertTriangle } from 'lucide-react';

interface EpicScenePanelProps {
  onGenerate: (images: string[]) => void;
  isGenerating: boolean;
}

export default function EpicScenePanel({ onGenerate, isGenerating }: EpicScenePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>(Array(6).fill(''));

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
    if (filledImages.length !== 6) {
      alert('⚠️ Please upload all 6 images!');
      return;
    }
    onGenerate(images);
  };

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

            {/* BETA Disclaimer */}
            <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <p className="text-yellow-200 font-bold mb-1">⚠️ THIS IS STILL IN BETA</p>
                <p className="text-yellow-300/80">
                  Perfect results are not guaranteed. Generation takes 10-15 minutes. This feature costs 10 credits.
                </p>
              </div>
            </div>

            {/* Image Upload Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="relative">
                  <div className="aspect-square bg-black border-2 border-zinc-800 rounded-lg overflow-hidden hover:border-red-600 transition-colors">
                    {images[index] ? (
                      <img
                        src={images[index]}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                        <Upload size={32} className="mb-2" />
                        <span className="text-xs">Image {index + 1}</span>
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
                  <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || images.filter(img => img).length !== 6}
              className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-zinc-800 disabled:to-zinc-900 text-white font-black text-lg rounded-lg transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  GENERATING EPIC SCENE... (10-15 min)
                </>
              ) : (
                <>
                  🎬 GENERATE EPIC SCENE
                  <span className="text-sm opacity-75">(10 credits)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
