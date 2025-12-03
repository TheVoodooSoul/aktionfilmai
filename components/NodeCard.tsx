'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Image as ImageIcon, Sparkles, Maximize2 } from 'lucide-react';
import Image from 'next/image';

type AspectRatio = '16:9' | '1:1' | '9:16';

interface NodeCardProps {
  node: {
    id: string;
    type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 'i2v' | 't2v' | 'lipsync' | 'action-pose' | 'coherent-scene' | 'image' | 'video' | string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    aspectRatio?: AspectRatio;
    imageData?: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    prompt?: string;
    dialogue?: string;
    coherentImages?: string[];
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
  onEdit?: (id: string) => void;
  isSelected: boolean;
  onClick: () => void;
  characterRefs?: Array<{ id: string; name: string; image_url: string }>;
  onSaveAsReference?: (nodeId: string) => void;
  onGenerateSequence?: () => void;
  isLinkingMode?: boolean;
  isLinkSource?: boolean;
}

// Aspect ratio presets with dimensions
const ASPECT_RATIOS: Record<AspectRatio, { width: number; previewAspect: string; label: string }> = {
  '16:9': { width: 400, previewAspect: 'aspect-video', label: 'Landscape' },
  '1:1': { width: 340, previewAspect: 'aspect-square', label: 'Square' },
  '9:16': { width: 280, previewAspect: 'aspect-[9/16]', label: 'Portrait' },
};

export default function NodeCard({ node, onUpdate, onDelete, onGenerate, onEdit, isSelected, onClick, characterRefs, onSaveAsReference, onGenerateSequence, isLinkingMode, isLinkSource }: NodeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(node.prompt || '');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  // Get current aspect ratio settings
  const currentAspect = node.aspectRatio || '16:9';
  const aspectConfig = ASPECT_RATIOS[currentAspect];
  const nodeWidth = aspectConfig.width;

  const getNodeTitle = () => {
    switch (node.type) {
      case 'character': return 'Character (A2E)';
      case 'coherent-scene': return 'Coherent Scene (⏱️ 10-15 min)';
      case 'scene': return 'Scene Builder (RunPod)';
      case 'action-pose': return 'Action Pose (LoRA)';
      case 'sketch': return 'Sketch to Image';
      case 'i2i': return 'Image to Image';
      case 't2i': return 'Text to Image';
      case 'i2v': return 'Image to Video (A2E)';
      case 't2v': return 'Text to Video (Avatar)';
      case 'lipsync': return 'Lipsync (A2E)';
      default: return 'Node';
    }
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'character': return 'CHR';
      case 'coherent-scene': return 'COH';
      case 'scene': return 'SCN';
      case 'action-pose': return 'ACT';
      case 'sketch': return 'SKT';
      case 'i2i': return 'I2I';
      case 't2i': return 'T2I';
      case 'i2v': return 'I2V';
      case 't2v': return 'T2V';
      case 'lipsync': return 'LIP';
      default: return 'NOD';
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate(node.id);
    setIsGenerating(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    onUpdate(node.id, {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: node.width || 480,
      height: node.height || 720,
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStart.width + deltaX));
    const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeStart.height + deltaY));

    onUpdate(node.id, {
      width: newWidth,
      height: newHeight,
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStart]);

  return (
    <div
      ref={nodeRef}
      className={`absolute bg-[#1a1a1a] border-2 rounded-xl shadow-xl transition-all cursor-pointer ${
        isLinkSource
          ? 'border-green-500 shadow-green-500/20'
          : isSelected
          ? 'border-red-500 shadow-red-500/20'
          : isLinkingMode
          ? 'border-blue-500/50 hover:border-blue-500'
          : 'border-zinc-800 hover:border-zinc-700'
      } ${isResizing ? 'select-none' : ''}`}
      style={{
        left: node.x,
        top: node.y,
        width: nodeWidth,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {/* Node Header */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-red-500 bg-red-950 px-1.5 py-0.5 rounded">{getNodeIcon()}</span>
          <span className="text-xs font-semibold text-white truncate max-w-[120px]">{getNodeTitle()}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Aspect Ratio Selector */}
          <div className="flex bg-black rounded overflow-hidden">
            {(['16:9', '1:1', '9:16'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(node.id, { aspectRatio: ratio });
                }}
                className={`px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                  currentAspect === ratio
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="text-zinc-600 hover:text-red-500 transition-colors ml-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-3 space-y-2">
        {/* Preview Area - Dynamic Aspect Ratio */}
        <div className={`relative bg-black rounded-lg overflow-hidden border border-zinc-800 group ${aspectConfig.previewAspect}`}>
          {node.imageData && !node.imageUrl && (
            <>
              <img src={node.imageData} alt="Sketch" className="w-full h-full object-cover" />
              {(node.type === 'sketch' || node.type === 'action-pose') && onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(node.id);
                  }}
                  className="absolute top-2 left-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-medium transition-colors z-10"
                >
                  Edit Sketch
                </button>
              )}
            </>
          )}
          {node.imageUrl && (
            <>
              {/* Character Image with Movie Poster Styling */}
              <div className="relative w-full h-full">
                <Image
                  src={node.imageUrl}
                  alt="Character"
                  fill
                  className="object-cover"
                />

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Save as reference button */}
              {onSaveAsReference && node.type === 'character' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveAsReference(node.id);
                  }}
                  className="absolute top-1 right-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded font-medium transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
                >
                  <Sparkles size={10} className="inline mr-1" />
                  Save @
                </button>
              )}
            </>
          )}
          {node.videoUrl && (
            <video src={node.videoUrl} controls className="w-full h-full object-cover" />
          )}
          {!node.imageData && !node.imageUrl && !node.videoUrl && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <ImageIcon size={32} className="opacity-30" />
              <p className="text-zinc-600 text-[10px] mt-1">No preview</p>
            </div>
          )}
        </div>

        {/* Prompt Input - Compact for each type */}
        {node.type === 'lipsync' ? (
          <textarea
            value={node.dialogue || ''}
            onChange={(e) => onUpdate(node.id, { dialogue: e.target.value })}
            placeholder="Dialogue..."
            className="w-full px-2 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
            rows={2}
            onClick={(e) => e.stopPropagation()}
          />
        ) : node.type === 'action-pose' ? (
          <div className="space-y-1.5">
            <select
              value={node.settings?.actionType || 'punch'}
              onChange={(e) => onUpdate(node.id, {
                settings: { ...node.settings, actionType: e.target.value }
              })}
              className="w-full px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs focus:outline-none focus:border-red-600 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="punch">Punch</option>
              <option value="kick">Kick</option>
              <option value="takedown">Takedown</option>
            </select>
            <textarea
              value={localPrompt}
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                onUpdate(node.id, { prompt: e.target.value });
              }}
              placeholder="Scene details..."
              className="w-full px-2 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : node.type === 'scene' ? (
          <div className="space-y-1.5">
            <select
              value={node.settings?.actionType || 'fight'}
              onChange={(e) => onUpdate(node.id, {
                settings: { ...node.settings, actionType: e.target.value }
              })}
              className="w-full px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs focus:outline-none focus:border-red-600 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="fight">Fight</option>
              <option value="chase">Chase</option>
              <option value="explosion">Explosion</option>
              <option value="gunfight">Gun Fight</option>
              <option value="martial-arts">Martial Arts</option>
            </select>
            <textarea
              value={localPrompt}
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                onUpdate(node.id, { prompt: e.target.value });
              }}
              placeholder="Scene description..."
              className="w-full px-2 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Character Upload Option */}
            {node.type === 'character' && (
              <div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onUpdate(node.id, {
                          uploadedFile: file,
                          uploadedFileType: file.type.startsWith('video') ? 'video' : 'image',
                          uploadedFilePreview: reader.result as string
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-2 py-1 bg-black border border-zinc-800 rounded text-white text-[10px] focus:outline-none focus:border-red-600 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-red-600 file:text-white"
                  onClick={(e) => e.stopPropagation()}
                />
                {(node as any).uploadedFilePreview && (
                  <p className="text-[10px] text-green-500 mt-0.5">✓ Uploaded</p>
                )}
              </div>
            )}
            <textarea
              value={localPrompt}
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                onUpdate(node.id, { prompt: e.target.value });
              }}
              placeholder={
                node.type === 'character' ? 'Character description...' :
                node.type === 'i2v' ? 'Movement & action...' :
                'Prompt...'
              }
              className="w-full px-2 py-1.5 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Character Reference Selector */}
        {characterRefs && characterRefs.length > 0 && (node.type === 'scene' || node.type === 'i2v' || node.type === 'lipsync' || node.type === 'action-pose' || node.type === 'i2i') && (
          <select
            value={node.settings?.characterRefs?.[0] || ''}
            onChange={(e) => {
              const selectedRef = e.target.value;
              onUpdate(node.id, {
                settings: {
                  ...node.settings,
                  characterRefs: selectedRef ? [selectedRef] : []
                }
              });
            }}
            className="w-full px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs focus:outline-none focus:border-red-600 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">@ Character Ref</option>
            {characterRefs.map(ref => (
              <option key={ref.id} value={ref.id}>
                @{ref.name || 'Unnamed'}
              </option>
            ))}
          </select>
        )}

        {/* Creativity Slider - Compact inline */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">Creativity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={(node.settings?.creativity || 0.7) * 100}
            onChange={(e) => onUpdate(node.id, {
              settings: { ...node.settings, creativity: parseInt(e.target.value) / 100 }
            })}
            className="flex-1 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-[10px] text-white w-6">{Math.round((node.settings?.creativity || 0.7) * 100)}%</span>
        </div>

        {/* Generate Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleGenerate();
          }}
          disabled={isGenerating}
          className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play size={12} />
              Generate
            </>
          )}
        </button>

        {/* Generate Sequence Button */}
        {onGenerateSequence && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateSequence();
            }}
            className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play size={12} />
            Sequence
          </button>
        )}

        {/* Linking Mode Indicator */}
        {isLinkingMode && !isLinkSource && (
          <p className="text-[10px] text-center text-zinc-500">Click to link</p>
        )}
        {isLinkSource && (
          <p className="text-[10px] text-center text-green-500">✓ Source</p>
        )}
      </div>

      {/* Connection Points */}
      <div className="absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-[#1a1a1a] cursor-pointer hover:scale-110 transition-transform" />
      <div className="absolute -left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-zinc-600 rounded-full border-2 border-[#1a1a1a]" />
    </div>
  );
}
