'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Image as ImageIcon, Sparkles, Maximize2, ArrowUpCircle, Pencil, Video, Crown, Wand2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

type AspectRatio = '16:9' | '1:1' | '9:16';

interface NodeCardProps {
  node: {
    id: string;
    type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 'i2v' | 't2v' | 'lipsync' | 'action-pose' | 'coherent-scene' | 'image' | 'video' | 'face-swap' | 'nanobanana' | string;
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
    faceImageUrl?: string;
    targetVideoUrl?: string;
    settings?: {
      creativity?: number;
      characterRefs?: string[];
      environment?: string;
      actionType?: string;
      controlnetMode?: 'img2img' | 'scribble' | 'canny' | 'openpose';
    };
  };
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string) => void;
  onEdit?: (id: string) => void;
  isSelected: boolean;
  onClick: () => void;
  characterRefs?: Array<{ id: string; name: string; image_url: string }>;
  faces?: Array<{ _id: string; face_url: string }>;
  onSaveAsReference?: (nodeId: string) => void;
  onGenerateSequence?: () => void;
  isLinkingMode?: boolean;
  isLinkSource?: boolean;
  // Connection port callbacks (click-based fallback)
  onRefOutputClick?: (nodeId: string) => void;  // Purple output - this node provides reference
  onRefInputClick?: (nodeId: string) => void;   // Purple input - this node receives references
  onSeqOutputClick?: (nodeId: string) => void;  // Blue output - last frame connection
  onSeqInputClick?: (nodeId: string) => void;   // Blue input - first frame connection
  onAudioOutputClick?: (nodeId: string) => void; // Green output - this node provides audio
  onAudioInputClick?: (nodeId: string) => void;  // Green input - this node receives audio (lipsync)
  // Wire dragging callbacks for visual wire feedback
  onPortDragStart?: (nodeId: string, portType: 'ref' | 'seq' | 'audio', isOutput: boolean, x: number, y: number) => void;
  onPortDragEnd?: (nodeId: string, portType: 'ref' | 'seq' | 'audio', isOutput: boolean) => void;
  // Connection state
  hasRefConnections?: boolean;  // Has reference inputs connected
  hasSeqNext?: boolean;         // Has sequence output connected
  hasSeqPrev?: boolean;         // Has sequence input connected
  hasAudioConnection?: boolean; // Has audio input connected
  refLinkingMode?: boolean;     // Currently linking references
  seqLinkingMode?: boolean;     // Currently linking sequence
  audioLinkingMode?: boolean;   // Currently linking audio
  // Upscale and nano-correct callbacks
  onUpscale?: (nodeId: string) => void;
  onNanoCorrect?: (nodeId: string) => void;
  isUpscaling?: boolean;
  // Premium Kling i2v
  onKlingI2V?: (nodeId: string) => void;
  isKlingGenerating?: boolean;
  // Magic prompt enhancement
  onMagicPrompt?: (nodeId: string, currentPrompt: string) => void;
  isMagicPromptLoading?: boolean;
  // Image upload for i2v and other image-input nodes
  onLoadImage?: (nodeId: string) => void;
}

// Resize constraints
const MIN_WIDTH = 200;
const MAX_WIDTH = 800;
const MIN_HEIGHT = 150;
const MAX_HEIGHT = 600;

// Aspect ratio presets with dimensions
const ASPECT_RATIOS: Record<AspectRatio, { width: number; previewAspect: string; label: string }> = {
  '16:9': { width: 400, previewAspect: 'aspect-video', label: 'Landscape' },
  '1:1': { width: 340, previewAspect: 'aspect-square', label: 'Square' },
  '9:16': { width: 280, previewAspect: 'aspect-[9/16]', label: 'Portrait' },
};

export default function NodeCard({
  node, onUpdate, onDelete, onGenerate, onEdit, isSelected, onClick, characterRefs, faces,
  onSaveAsReference, onGenerateSequence, isLinkingMode, isLinkSource,
  onRefOutputClick, onRefInputClick, onSeqOutputClick, onSeqInputClick,
  onAudioOutputClick, onAudioInputClick,
  onPortDragStart, onPortDragEnd,
  hasRefConnections, hasSeqNext, hasSeqPrev, hasAudioConnection,
  refLinkingMode, seqLinkingMode, audioLinkingMode,
  onUpscale, onNanoCorrect, isUpscaling,
  onKlingI2V, isKlingGenerating,
  onMagicPrompt, isMagicPromptLoading,
  onLoadImage
}: NodeCardProps) {
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
    // Don't start drag if clicking on interactive elements or connection ports
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select') ||
        target.closest('[data-port]')) return;

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
      data-node-id={node.id}
      className={`absolute bg-[#1a1a1a] border-2 rounded-xl shadow-xl transition-all cursor-pointer overflow-visible ${
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

              {/* Image action buttons */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                {/* Premium Kling i2v button */}
                {onKlingI2V && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onKlingI2V(node.id);
                    }}
                    disabled={isKlingGenerating}
                    className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-800 disabled:to-pink-800 text-white text-[10px] rounded font-medium shadow-lg"
                    title="Kling Premium - Generate cinematic video (5 credits) - No violent content allowed"
                  >
                    <Crown size={10} className={`inline mr-1 ${isKlingGenerating ? 'animate-pulse' : ''}`} />
                    {isKlingGenerating ? 'KLING...' : 'KLING'}
                  </button>
                )}
                {/* Upscale button */}
                {onUpscale && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpscale(node.id);
                    }}
                    disabled={isUpscaling}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-[10px] rounded font-medium shadow-lg"
                    title="Upscale image"
                  >
                    <ArrowUpCircle size={10} className={`inline mr-1 ${isUpscaling ? 'animate-spin' : ''}`} />
                    {isUpscaling ? '...' : 'HD'}
                  </button>
                )}
                {/* Nano correct button */}
                {onNanoCorrect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNanoCorrect(node.id);
                    }}
                    className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] rounded font-medium shadow-lg"
                    title="Nano correct - paint to fix"
                  >
                    <Pencil size={10} className="inline mr-1" />
                    Fix
                  </button>
                )}
                {/* Save as reference button */}
                {onSaveAsReference && node.type === 'character' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveAsReference(node.id);
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded font-medium shadow-lg"
                  >
                    <Sparkles size={10} className="inline mr-1" />
                    Save @
                  </button>
                )}
              </div>
            </>
          )}
          {node.videoUrl && (
            <video src={node.videoUrl} controls className="w-full h-full object-cover" />
          )}
          {!node.imageData && !node.imageUrl && !node.videoUrl && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              {/* Show upload button for nodes that need an input image */}
              {(node.type === 'i2v' || node.type === 'i2i' || node.type === 'lipsync' || node.type === 'face-swap') && onLoadImage ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadImage(node.id);
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-700 hover:border-red-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <ImageIcon size={32} className="text-zinc-500" />
                    <span className="text-xs text-zinc-400">Click to Load Image</span>
                  </button>
                  <p className="text-zinc-600 text-[9px] mt-2">or drag from another node</p>
                </>
              ) : (
                <>
                  <ImageIcon size={32} className="opacity-30" />
                  <p className="text-zinc-600 text-[10px] mt-1">No preview</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Prompt Input - Compact for each type */}
        {node.type === 'lipsync' ? (
          <div className="relative">
            <textarea
              value={node.dialogue || ''}
              onChange={(e) => onUpdate(node.id, { dialogue: e.target.value })}
              placeholder="Dialogue..."
              className="w-full px-2 py-1.5 pr-8 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
            {onMagicPrompt && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMagicPrompt(node.id, node.dialogue || '');
                }}
                disabled={isMagicPromptLoading}
                className="absolute right-1 top-1 p-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-700 disabled:to-orange-700 text-white rounded transition-all"
                title="Magic Prompt - Enhance dialogue with AI"
              >
                <Wand2 size={12} className={isMagicPromptLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
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
            <div className="relative">
              <textarea
                value={localPrompt}
                onChange={(e) => {
                  setLocalPrompt(e.target.value);
                  onUpdate(node.id, { prompt: e.target.value });
                }}
                placeholder="Scene details..."
                className="w-full px-2 py-1.5 pr-8 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
              {onMagicPrompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMagicPrompt(node.id, localPrompt);
                  }}
                  disabled={isMagicPromptLoading}
                  className="absolute right-1 top-1 p-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-700 disabled:to-orange-700 text-white rounded transition-all"
                  title="Magic Prompt - Enhance with AI"
                >
                  <Wand2 size={12} className={isMagicPromptLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
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
            <div className="relative">
              <textarea
                value={localPrompt}
                onChange={(e) => {
                  setLocalPrompt(e.target.value);
                  onUpdate(node.id, { prompt: e.target.value });
                }}
                placeholder="Scene description..."
                className="w-full px-2 py-1.5 pr-8 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
              {onMagicPrompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMagicPrompt(node.id, localPrompt);
                  }}
                  disabled={isMagicPromptLoading}
                  className="absolute right-1 top-1 p-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-700 disabled:to-orange-700 text-white rounded transition-all"
                  title="Magic Prompt - Enhance with AI"
                >
                  <Wand2 size={12} className={isMagicPromptLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>
        ) : node.type === 'face-swap' ? (
          <div className="space-y-1.5">
            <div className="text-[10px] text-zinc-500 font-medium">Select Face (from library)</div>
            {faces && faces.length > 0 ? (
              <select
                value={node.faceImageUrl || ''}
                onChange={(e) => onUpdate(node.id, { faceImageUrl: e.target.value })}
                className="w-full px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs focus:outline-none focus:border-red-600 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Select a face...</option>
                {faces.map((face, idx) => (
                  <option key={face._id} value={face.face_url}>
                    Face {idx + 1}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={node.faceImageUrl || ''}
                onChange={(e) => onUpdate(node.id, { faceImageUrl: e.target.value })}
                placeholder="Face image URL (or upload in Character Studio)"
                className="w-full px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {node.faceImageUrl && (
              <div className="w-12 h-12 rounded overflow-hidden border border-zinc-700">
                <img src={node.faceImageUrl} alt="Selected face" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-[10px] text-zinc-500 font-medium mt-2">Target Video URL</div>
            <input
              type="text"
              value={node.targetVideoUrl || ''}
              onChange={(e) => onUpdate(node.id, { targetVideoUrl: e.target.value })}
              placeholder="Video URL to swap face onto..."
              className="w-full px-2 py-1 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-[9px] text-zinc-600">💡 Upload faces in Character Studio → Face Library</p>
          </div>
        ) : node.type === 'nanobanana' ? (
          <div className="space-y-1.5">
            <div className="relative">
              <textarea
                value={localPrompt}
                onChange={(e) => {
                  setLocalPrompt(e.target.value);
                  onUpdate(node.id, { prompt: e.target.value });
                }}
                placeholder="Multi-character scene description..."
                className="w-full px-2 py-1.5 pr-8 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
              {onMagicPrompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMagicPrompt(node.id, localPrompt);
                  }}
                  disabled={isMagicPromptLoading}
                  className="absolute right-1 top-1 p-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-700 disabled:to-orange-700 text-white rounded transition-all"
                  title="Magic Prompt - Enhance with AI"
                >
                  <Wand2 size={12} className={isMagicPromptLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
            <p className="text-[9px] text-zinc-600">Uses your character refs + sketch</p>
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
            <div className="relative">
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
                className="w-full px-2 py-1.5 pr-8 bg-black border border-zinc-800 rounded text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
              {/* Magic Prompt Button */}
              {onMagicPrompt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMagicPrompt(node.id, localPrompt);
                  }}
                  disabled={isMagicPromptLoading}
                  className="absolute right-1 top-1 p-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-700 disabled:to-orange-700 text-white rounded transition-all"
                  title="Magic Prompt - Enhance with AI"
                >
                  <Wand2 size={12} className={isMagicPromptLoading ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
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

        {/* ControlNet Mode Selector - For sketch and action-pose nodes */}
        {(node.type === 'sketch' || node.type === 'action-pose') && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500 mr-1">Mode</span>
            {(['img2img', 'scribble', 'canny', 'openpose'] as const).map((mode) => (
              <button
                key={mode}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(node.id, {
                    settings: { ...node.settings, controlnetMode: mode }
                  });
                }}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors ${
                  (node.settings?.controlnetMode || 'img2img') === mode
                    ? mode === 'openpose' ? 'bg-green-600 text-white' :
                      mode === 'canny' ? 'bg-blue-600 text-white' :
                      mode === 'scribble' ? 'bg-purple-600 text-white' :
                      'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title={
                  mode === 'img2img' ? 'Standard image-to-image (loose)' :
                  mode === 'scribble' ? 'ControlNet Scribble (follows rough lines)' :
                  mode === 'canny' ? 'ControlNet Canny (precise edges)' :
                  'ControlNet OpenPose (follows body pose)'
                }
              >
                {mode === 'img2img' ? 'I2I' : mode === 'openpose' ? 'POSE' : mode.toUpperCase()}
              </button>
            ))}
          </div>
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

      {/* Connection Ports */}
      {/* LEFT SIDE - Input Ports */}
      {/* Reference Input (Purple) - receives references from other nodes */}
      <div
        data-port="ref-input"
        className={`absolute -left-2 top-[25%] w-4 h-4 rounded-full border-2 border-[#1a1a1a] cursor-pointer transition-all hover:scale-125 z-50 ${
          hasRefConnections ? 'bg-purple-500' : 'bg-purple-900'
        } ${refLinkingMode ? 'ring-2 ring-purple-400 animate-pulse' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRefInputClick?.(node.id);
        }}
        title="Reference Input (connect character/style refs here)"
      />
      {/* Audio Input (Green) - for lipsync nodes only */}
      {(node.type === 'lipsync' || node.type === 'talking-photo' || node.type === 't2v') && (
        <div
          data-port="audio-input"
          className={`absolute -left-2 top-[50%] w-4 h-4 rounded-full border-2 border-[#1a1a1a] cursor-pointer transition-all hover:scale-125 z-50 ${
            hasAudioConnection ? 'bg-green-500' : 'bg-green-900'
          } ${audioLinkingMode ? 'ring-2 ring-green-400 animate-pulse' : ''}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onAudioInputClick?.(node.id);
          }}
          title="Audio Input (connect TTS or audio source)"
        />
      )}
      {/* Sequence Input (Blue) - first frame input */}
      <div
        data-port="seq-input"
        className={`absolute -left-2 top-[75%] w-4 h-4 rounded-full border-2 border-[#1a1a1a] cursor-pointer transition-all hover:scale-125 z-50 ${
          hasSeqPrev ? 'bg-blue-500' : 'bg-blue-900'
        } ${seqLinkingMode ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSeqInputClick?.(node.id);
        }}
        title="Sequence Input (connects from previous frame)"
      />

      {/* RIGHT SIDE - Output Ports */}
      {/* Reference Output (Purple) - this node can be used as reference */}
      <div
        data-port="ref-output"
        className={`absolute -right-2 top-[25%] w-4 h-4 rounded-full border-2 border-[#1a1a1a] cursor-crosshair transition-all hover:scale-125 z-50 ${
          node.imageUrl ? 'bg-purple-500 hover:bg-purple-400' : 'bg-purple-900/50'
        } ${refLinkingMode ? 'ring-2 ring-purple-400 animate-pulse' : ''}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (node.imageUrl && onPortDragStart) {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            onPortDragStart(node.id, 'ref', true, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (node.imageUrl) onRefOutputClick?.(node.id);
        }}
        title="Reference Output (drag to connect as reference)"
      />
      {/* Audio Output (Green) - for TTS nodes */}
      {node.audioUrl && (
        <div
          data-port="audio-output"
          className={`absolute -right-2 top-[50%] w-4 h-4 rounded-full border-2 border-[#1a1a1a] cursor-crosshair transition-all hover:scale-125 z-50 bg-green-500 hover:bg-green-400 ${
            audioLinkingMode ? 'ring-2 ring-green-400 animate-pulse' : ''
          }`}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (onPortDragStart) {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              onPortDragStart(node.id, 'audio', true, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onAudioOutputClick?.(node.id);
          }}
          title="Audio Output (connect to lipsync)"
        />
      )}
      {/* Sequence Output (Blue) - connects to next frame */}
      <div
        data-port="seq-output"
        className={`absolute -right-2 top-[75%] w-4 h-4 rounded-full border-2 border-[#1a1a1a] cursor-crosshair transition-all hover:scale-125 z-50 ${
          hasSeqNext ? 'bg-blue-500' : node.imageUrl ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-900/50'
        } ${seqLinkingMode ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (node.imageUrl && onPortDragStart) {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            onPortDragStart(node.id, 'seq', true, rect.left + rect.width / 2, rect.top + rect.height / 2);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (node.imageUrl) onSeqOutputClick?.(node.id);
        }}
        title="Sequence Output (connect to next frame)"
      />

      {/* Port Labels - visible on node */}
      <div className="absolute -left-1 top-[25%] -translate-y-1/2 -translate-x-full pr-1 text-[7px] text-purple-400 font-bold">REF</div>
      {(node.type === 'lipsync' || node.type === 'talking-photo' || node.type === 't2v') && (
        <div className="absolute -left-1 top-[50%] -translate-y-1/2 -translate-x-full pr-1 text-[7px] text-green-400 font-bold">AUD</div>
      )}
      <div className="absolute -left-1 top-[75%] -translate-y-1/2 -translate-x-full pr-1 text-[7px] text-blue-400 font-bold">SEQ</div>
      <div className="absolute -right-1 top-[25%] -translate-y-1/2 translate-x-full pl-1 text-[7px] text-purple-400 font-bold">REF</div>
      {node.audioUrl && (
        <div className="absolute -right-1 top-[50%] -translate-y-1/2 translate-x-full pl-1 text-[7px] text-green-400 font-bold">AUD</div>
      )}
      <div className="absolute -right-1 top-[75%] -translate-y-1/2 translate-x-full pl-1 text-[7px] text-blue-400 font-bold">SEQ</div>
    </div>
  );
}
