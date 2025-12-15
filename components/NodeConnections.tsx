'use client';

import React from 'react';
import { CanvasNode } from '@/lib/types';

interface NodeConnectionsProps {
  nodes: CanvasNode[];
  characterRefs: { id: string; name: string; image_url: string; x?: number; y?: number }[];
}

// Get node width based on aspect ratio
const getNodeWidth = (aspectRatio?: string) => {
  switch (aspectRatio) {
    case '1:1': return 340;
    case '9:16': return 280;
    default: return 400;
  }
};

// Generate smooth bezier curve path
const generateCurvePath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = x2 - x1;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
};

export default function NodeConnections({ nodes, characterRefs }: NodeConnectionsProps) {
  const renderConnections = () => {
    const lines: React.ReactElement[] = [];

    nodes.forEach((node) => {
      const nodeWidth = getNodeWidth(node.aspectRatio);
      const nodeHeight = 300; // Approximate height

      // Draw character reference connections from sidebar (purple, dashed)
      if (node.settings?.characterRefs && node.settings.characterRefs.length > 0) {
        node.settings.characterRefs.forEach((refId) => {
          const ref = characterRefs.find(r => r.id === refId);
          if (ref && ref.x !== undefined && ref.y !== undefined) {
            const x1 = ref.x + 80;
            const y1 = ref.y + 80;
            const x2 = node.x - 8; // Left side ref input port
            const y2 = node.y + nodeHeight * 0.3;

            const path = generateCurvePath(x1, y1, x2, y2);

            lines.push(
              <g key={`char-ref-${refId}-${node.id}`}>
                <path d={path} stroke="#a855f7" strokeWidth="2" fill="none" strokeDasharray="8,4" opacity="0.5" />
                <circle cx={x2} cy={y2} r="6" fill="#a855f7" opacity="0.8" />
              </g>
            );
          }
        });
      }

      // Draw node-to-node reference connections (purple, solid)
      if (node.connections?.references && node.connections.references.length > 0) {
        node.connections.references.forEach((refNodeId) => {
          const refNode = nodes.find(n => n.id === refNodeId);
          if (refNode) {
            const refNodeWidth = getNodeWidth(refNode.aspectRatio);
            const refNodeHeight = 300;

            // From ref node's right output to this node's left input
            const x1 = refNode.x + refNodeWidth + 8; // Right side ref output
            const y1 = refNode.y + refNodeHeight * 0.3;
            const x2 = node.x - 8; // Left side ref input
            const y2 = node.y + nodeHeight * 0.3;

            const path = generateCurvePath(x1, y1, x2, y2);

            lines.push(
              <g key={`node-ref-${refNodeId}-${node.id}`}>
                {/* Glow */}
                <path d={path} stroke="#a855f7" strokeWidth="8" fill="none" opacity="0.2" filter="url(#glow)" />
                {/* Main wire */}
                <path d={path} stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Animated overlay */}
                <path d={path} stroke="#c084fc" strokeWidth="2" fill="none" strokeDasharray="8,12" strokeLinecap="round" className="animate-wire" />
                {/* End dots */}
                <circle cx={x1} cy={y1} r="5" fill="#a855f7" />
                <circle cx={x2} cy={y2} r="5" fill="#a855f7" />
              </g>
            );
          }
        });
      }

      // Draw audio connections (green, solid)
      if (node.connections?.audioSource) {
        const audioNode = nodes.find(n => n.id === node.connections?.audioSource);
        if (audioNode) {
          const audioNodeWidth = getNodeWidth(audioNode.aspectRatio);
          const audioNodeHeight = 300;

          // From audio node's right output to this node's left input (at 50%)
          const x1 = audioNode.x + audioNodeWidth + 8;
          const y1 = audioNode.y + audioNodeHeight * 0.5;
          const x2 = node.x - 8;
          const y2 = node.y + nodeHeight * 0.5;

          const path = generateCurvePath(x1, y1, x2, y2);

          lines.push(
            <g key={`audio-${audioNode.id}-${node.id}`}>
              {/* Glow */}
              <path d={path} stroke="#22c55e" strokeWidth="8" fill="none" opacity="0.2" filter="url(#glow)" />
              {/* Main wire */}
              <path d={path} stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Animated overlay */}
              <path d={path} stroke="#4ade80" strokeWidth="2" fill="none" strokeDasharray="8,12" strokeLinecap="round" className="animate-wire" />
              {/* End dots */}
              <circle cx={x1} cy={y1} r="5" fill="#22c55e" />
              <circle cx={x2} cy={y2} r="5" fill="#22c55e" />
              {/* Label */}
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} fill="#22c55e" fontSize="10" textAnchor="middle" fontWeight="bold">
                AUDIO
              </text>
            </g>
          );
        }
      }

      // Draw sequence connections (blue, solid)
      if (node.connections?.next) {
        const nextNode = nodes.find(n => n.id === node.connections?.next);
        if (nextNode) {
          const nextNodeWidth = getNodeWidth(nextNode.aspectRatio);
          const nextNodeHeight = 300;

          // From this node's right seq output to next node's left seq input
          const x1 = node.x + nodeWidth + 8; // Right side seq output
          const y1 = node.y + nodeHeight * 0.7;
          const x2 = nextNode.x - 8; // Left side seq input
          const y2 = nextNode.y + nextNodeHeight * 0.7;

          const path = generateCurvePath(x1, y1, x2, y2);

          lines.push(
            <g key={`seq-${node.id}-${nextNode.id}`}>
              {/* Glow */}
              <path d={path} stroke="#3b82f6" strokeWidth="8" fill="none" opacity="0.2" filter="url(#glow)" />
              {/* Main wire */}
              <path d={path} stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Animated overlay */}
              <path d={path} stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="8,12" strokeLinecap="round" className="animate-wire" />
              {/* End dots */}
              <circle cx={x1} cy={y1} r="5" fill="#3b82f6" />
              <circle cx={x2} cy={y2} r="5" fill="#3b82f6" />
              {/* Label */}
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} fill="#3b82f6" fontSize="10" textAnchor="middle" fontWeight="bold">
                SEQUENCE
              </text>
            </g>
          );
        }
      }
    });

    return lines;
  };

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <style>{`
        @keyframes wireDash {
          to { stroke-dashoffset: -20; }
        }
        .animate-wire {
          animation: wireDash 1s linear infinite;
        }
      `}</style>
      {renderConnections()}
    </svg>
  );
}
