'use client';

import { useState } from 'react';
import { Play, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface NodeCardProps {
  node: {
    id: string;
    type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 't2v' | 'lipsync' | 'image' | 'video';
    x: number;
    y: number;
    imageData?: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    prompt?: string;
    dialogue?: string;
    settings?: {
      creativity?: number;
      characterRefs?: string[];
      environment?: string;
      actionType?: string;
    };
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
  isSelected: boolean;
  onClick: () => void;
}

export default function NodeCard({ node, onUpdate, onDelete, onGenerate, isSelected, onClick }: NodeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(node.prompt || '');

  const getNodeTitle = () => {
    switch (node.type) {
      case 'character': return 'Character (A2E)';
      case 'scene': return 'Scene Builder (RunPod)';
      case 'sketch': return 'Sketch to Image';
      case 'i2i': return 'Image to Image';
      case 't2i': return 'Text to Image';
      case 't2v': return 'Image to Video (A2E)';
      case 'lipsync': return 'Lipsync (A2E)';
      default: return 'Node';
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'character': return '👤';
      case 'scene': return '🎭';
      case 'sketch': return '✏️';
      case 'i2i': return '🖼️';
      case 't2i': return '✨';
      case 't2v': return '🎬';
      case 'lipsync': return '🗣️';
      default: return '⚡';
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate(node.id);
    setIsGenerating(false);
  };

  return (
    <div
      className={`absolute bg-[#1a1a1a] border-2 rounded-xl shadow-xl transition-all cursor-pointer ${
        isSelected ? 'border-red-500 shadow-red-500/20' : 'border-zinc-800 hover:border-zinc-700'
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: 320,
      }}
      onClick={onClick}
    >
      {/* Node Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getNodeIcon()}</span>
          <span className="text-sm font-semibold text-white">{getNodeTitle()}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="text-zinc-600 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Node Content */}
      <div className="p-4 space-y-3">
        {/* Preview Area */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800">
          {node.imageData && !node.imageUrl && (
            <img src={node.imageData} alt="Sketch" className="w-full h-full object-cover" />
          )}
          {node.imageUrl && (
            <Image src={node.imageUrl} alt="Generated" fill className="object-cover" />
          )}
          {node.videoUrl && (
            <video src={node.videoUrl} controls className="w-full h-full" />
          )}
          {!node.imageData && !node.imageUrl && !node.videoUrl && (
            <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
              <ImageIcon size={32} className="opacity-50" />
            </div>
          )}
        </div>

        {/* Prompt Input - Different for each type */}
        {node.type === 'lipsync' ? (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Dialogue</label>
            <textarea
              value={node.dialogue || ''}
              onChange={(e) => onUpdate(node.id, { dialogue: e.target.value })}
              placeholder="What does your character say?"
              className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-red-600 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : node.type === 'scene' ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Action Type</label>
              <select
                value={node.settings?.actionType || 'fight'}
                onChange={(e) => onUpdate(node.id, {
                  settings: { ...node.settings, actionType: e.target.value }
                })}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-600 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="fight">Fight Scene</option>
                <option value="chase">Chase Scene</option>
                <option value="explosion">Explosion</option>
                <option value="gunfight">Gun Fight</option>
                <option value="martial-arts">Martial Arts</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Scene Description</label>
              <textarea
                value={localPrompt}
                onChange={(e) => {
                  setLocalPrompt(e.target.value);
                  onUpdate(node.id, { prompt: e.target.value });
                }}
                placeholder="Describe the action scene in detail..."
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-red-600 resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Prompt</label>
            <textarea
              value={localPrompt}
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                onUpdate(node.id, { prompt: e.target.value });
              }}
              placeholder={
                node.type === 'character' ? 'Describe your action hero character...' :
                node.type === 't2v' ? 'Describe the action movement...' :
                'Describe the action scene...'
              }
              className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-red-600 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Creativity Slider */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block flex items-center justify-between">
            <span>Creativity</span>
            <span className="text-white font-medium">{Math.round((node.settings?.creativity || 0.7) * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={(node.settings?.creativity || 0.7) * 100}
            onChange={(e) => onUpdate(node.id, {
              settings: { ...node.settings, creativity: parseInt(e.target.value) / 100 }
            })}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play size={16} />
              Generate
            </>
          )}
        </button>
      </div>

      {/* Connection Points */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-[#1a1a1a] cursor-pointer hover:scale-110 transition-transform" />
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-zinc-600 rounded-full border-2 border-[#1a1a1a]" />
    </div>
  );
}
