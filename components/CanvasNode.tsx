'use client';

import { useState } from 'react';
import { CanvasNode as NodeType } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Play, Link, Download, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface CanvasNodeProps {
  node: NodeType;
  onPreview: (nodeId: string) => void;
  onLink: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

export default function CanvasNode({ node, onPreview, onLink, onDelete }: CanvasNodeProps) {
  const { selectNode, canvas } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const isSelected = canvas.selectedNodeId === node.id;

  return (
    <div
      className={`absolute p-4 bg-zinc-900 rounded-lg border-2 transition-all cursor-move ${
        isSelected ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-zinc-800'
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
      }}
      onClick={() => selectNode(node.id)}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400 uppercase">
          {node.type === 'sketch' ? 'Sketch' : node.type === 'image' ? 'Image' : 'Video'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="text-zinc-600 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Node Content */}
      <div className="relative aspect-video bg-zinc-950 rounded-lg overflow-hidden mb-3">
        {node.imageData && !node.imageUrl && (
          <img src={node.imageData} alt="Sketch" className="w-full h-full object-cover" />
        )}
        {node.imageUrl && (
          <Image
            src={node.imageUrl}
            alt="Generated"
            fill
            className="object-cover"
          />
        )}
        {node.videoUrl && (
          <video src={node.videoUrl} controls className="w-full h-full" />
        )}
        {!node.imageData && !node.imageUrl && !node.videoUrl && (
          <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
            Empty Node
          </div>
        )}
      </div>

      {/* Node Actions */}
      <div className="flex gap-2">
        {node.type === 'sketch' && !node.imageUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(node.id);
            }}
            disabled={isGenerating}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play size={14} />
            {isGenerating ? 'Generating...' : 'Preview (1 credit)'}
          </button>
        )}
        {node.imageUrl && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLink(node.id);
              }}
              className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Link size={14} />
              Link Node
            </button>
            <a
              href={node.imageUrl}
              download
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg flex items-center justify-center transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={14} />
            </a>
          </>
        )}
      </div>

      {/* Creativity Display */}
      {node.settings?.creativity !== undefined && (
        <div className="mt-2 text-xs text-zinc-500">
          Creativity: {Math.round(node.settings.creativity * 100)}%
        </div>
      )}
    </div>
  );
}
