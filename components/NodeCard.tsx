'use client';

import { useState, useEffect } from 'react';
import { Play, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface NodeCardProps {
  node: {
    id: string;
    type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 'i2v' | 't2v' | 'lipsync' | 'action-pose' | 'coherent-scene' | 'image' | 'video';
    x: number;
    y: number;
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

export default function NodeCard({ node, onUpdate, onDelete, onGenerate, onEdit, isSelected, onClick, characterRefs, onSaveAsReference, onGenerateSequence, isLinkingMode, isLinkSource }: NodeCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(node.prompt || '');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  return (
    <div
      className={`absolute bg-[#1a1a1a] border-2 rounded-xl shadow-xl transition-all cursor-pointer ${
        isLinkSource
          ? 'border-green-500 shadow-green-500/20'
          : isSelected
          ? 'border-red-500 shadow-red-500/20'
          : isLinkingMode
          ? 'border-blue-500/50 hover:border-blue-500'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: 320,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      {/* Node Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-red-500 bg-red-950 px-2 py-1 rounded">{getNodeIcon()}</span>
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
        {/* Preview Area - Movie Poster Style */}
        <div className="relative aspect-[2/3] bg-black rounded-lg overflow-hidden border border-zinc-800 group">
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

                {/* Film grain overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-30 mix-blend-overlay pointer-events-none" />

                {/* Dramatic gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-transparent to-transparent opacity-50" />

                {/* Red accent lighting */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent mix-blend-screen opacity-40" />

                {node.type === 'character' && (
                  <>
                    {/* Character name/title - Movie poster style */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <div className="space-y-1">
                        {/* Character designation */}
                        <div className="flex items-center gap-2">
                          <div className="h-px bg-red-600 w-8" />
                          <span className="text-red-500 text-[10px] font-bold tracking-[0.2em] uppercase">Action Hero</span>
                        </div>

                        {/* Character prompt as title */}
                        {localPrompt && (
                          <h3 className="text-white font-black text-lg leading-tight tracking-tight uppercase line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                            {localPrompt.substring(0, 50)}
                          </h3>
                        )}

                        {/* Status indicators */}
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
                          {(node as any).avatarId && (
                            <span className="flex items-center gap-1 text-green-400">
                              <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                              AVATAR READY
                            </span>
                          )}
                          {!(node as any).avatarId && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <span className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
                              TRAINING...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Corner accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-red-600 opacity-50" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-red-600 opacity-50" />
                  </>
                )}
              </div>

              {/* Action buttons on hover */}
              {onSaveAsReference && node.type === 'character' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSaveAsReference(node.id);
                  }}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 shadow-lg z-10"
                >
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} />
                    SAVE AS @ REF
                  </span>
                </button>
              )}
            </>
          )}
          {node.videoUrl && (
            <video src={node.videoUrl} controls className="w-full h-full" />
          )}
          {!node.imageData && !node.imageUrl && !node.videoUrl && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-sm gap-3">
              <ImageIcon size={48} className="opacity-30" />
              <div className="text-center px-4">
                <p className="text-zinc-500 text-xs">No preview yet</p>
                <p className="text-zinc-700 text-[10px] mt-1">Generate to create your character</p>
              </div>
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
        ) : node.type === 'action-pose' ? (
          <div className="space-y-2">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Action Pose</label>
              <select
                value={node.settings?.actionType || 'punch'}
                onChange={(e) => onUpdate(node.id, {
                  settings: { ...node.settings, actionType: e.target.value }
                })}
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-600 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="punch">Punch</option>
                <option value="kick">Kick</option>
                <option value="takedown">Takedown</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Description (optional)</label>
              <textarea
                value={localPrompt}
                onChange={(e) => {
                  setLocalPrompt(e.target.value);
                  onUpdate(node.id, { prompt: e.target.value });
                }}
                placeholder="Additional scene details..."
                className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-red-600 resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
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
            {/* Character Upload Option */}
            {node.type === 'character' && (
              <div className="mb-3">
                <label className="text-xs text-zinc-500 mb-1 block">Upload Character (Image or Video)</label>
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
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-600 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-red-600 file:text-white hover:file:bg-red-700"
                  onClick={(e) => e.stopPropagation()}
                />
                {(node as any).uploadedFilePreview && (
                  <div className="mt-2 text-xs text-green-500">
                    ✓ {(node as any).uploadedFileType === 'video' ? 'Video' : 'Image'} uploaded (FREE avatar training!)
                  </div>
                )}
                <div className="mt-1 text-xs text-zinc-600">
                  Video: FREE avatar training, better lipsync | Image: 30 credits
                </div>
              </div>
            )}

            <label className="text-xs text-zinc-500 mb-1 block">
              {node.type === 'character' ? 'Or Generate from Prompt (2 credits)' : 'Prompt'}
            </label>
            <textarea
              value={localPrompt}
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                onUpdate(node.id, { prompt: e.target.value });
              }}
              placeholder={
                node.type === 'character' ? 'Describe your action hero character...' :
                node.type === 'i2v' ? 'Describe the action movement...' :
                'Describe the action scene...'
              }
              className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-red-600 resize-none"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Character Reference Selector */}
        {characterRefs && characterRefs.length > 0 && (node.type === 'scene' || node.type === 'i2v' || node.type === 'lipsync' || node.type === 'action-pose' || node.type === 'i2i') && (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Character Reference</label>
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
              className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-red-600 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">None</option>
              {characterRefs.map(ref => (
                <option key={ref.id} value={ref.id}>
                  {ref.name || 'Unnamed Character'}
                </option>
              ))}
            </select>
            {node.settings?.characterRefs?.[0] && (
              <div className="mt-1 text-xs text-red-500">
                ● Connected to character
              </div>
            )}
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

        {/* Generate Sequence Button (when node has a connection) */}
        {onGenerateSequence && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateSequence();
            }}
            className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play size={16} />
            Generate Sequence
          </button>
        )}

        {/* Linking Mode Indicator */}
        {isLinkingMode && !isLinkSource && (
          <div className="text-xs text-center text-zinc-500 italic">
            Click to link as target frame
          </div>
        )}
        {isLinkSource && (
          <div className="text-xs text-center text-green-500 font-medium">
            ✓ Source frame selected
          </div>
        )}
      </div>

      {/* Connection Points */}
      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-[#1a1a1a] cursor-pointer hover:scale-110 transition-transform" />
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-zinc-600 rounded-full border-2 border-[#1a1a1a]" />
    </div>
  );
}
