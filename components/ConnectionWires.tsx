'use client';

import React from 'react';
import { CanvasNode } from '@/lib/types';

interface ConnectionWiresProps {
  nodes: CanvasNode[];
  scale: number;
  offsetX: number;
  offsetY: number;
}

// Get node dimensions based on aspect ratio
const getNodeWidth = (aspectRatio?: string) => {
  switch (aspectRatio) {
    case '1:1': return 340;
    case '9:16': return 280;
    default: return 400; // 16:9
  }
};

// Calculate port positions for a node
const getPortPositions = (node: CanvasNode) => {
  const width = getNodeWidth(node.aspectRatio);
  const height = 300; // Approximate node height

  return {
    // Left side inputs (at 30% and 70% from top)
    refInput: { x: node.x - 8, y: node.y + height * 0.3 },
    seqInput: { x: node.x - 8, y: node.y + height * 0.7 },
    // Right side outputs
    refOutput: { x: node.x + width + 8, y: node.y + height * 0.3 },
    seqOutput: { x: node.x + width + 8, y: node.y + height * 0.7 },
  };
};

// Generate a smooth bezier curve path between two points
const generateWirePath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string => {
  // Calculate control points for a smooth curve
  const dx = endX - startX;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);

  // Control points extend horizontally from start/end
  const cp1x = startX + controlOffset;
  const cp1y = startY;
  const cp2x = endX - controlOffset;
  const cp2y = endY;

  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
};

export default function ConnectionWires({ nodes, scale, offsetX, offsetY }: ConnectionWiresProps) {
  const wires: React.ReactElement[] = [];

  nodes.forEach((node) => {
    const sourcePositions = getPortPositions(node);

    // Draw sequence connection (blue wire)
    if (node.connections?.next) {
      const targetNode = nodes.find((n) => n.id === node.connections?.next);
      if (targetNode) {
        const targetPositions = getPortPositions(targetNode);

        // Wire from source's seq output to target's seq input
        const path = generateWirePath(
          sourcePositions.seqOutput.x,
          sourcePositions.seqOutput.y,
          targetPositions.seqInput.x,
          targetPositions.seqInput.y
        );

        wires.push(
          <g key={`seq-${node.id}-${targetNode.id}`}>
            {/* Glow effect */}
            <path
              d={path}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={6}
              strokeLinecap="round"
              opacity={0.3}
              filter="blur(4px)"
            />
            {/* Main wire */}
            <path
              d={path}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeLinecap="round"
              className="transition-all"
            />
            {/* Animated dash overlay */}
            <path
              d={path}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="8 12"
              className="animate-dash"
            />
          </g>
        );
      }
    }

    // Draw reference connections (purple wires)
    if (node.connections?.references && node.connections.references.length > 0) {
      node.connections.references.forEach((refNodeId) => {
        const refNode = nodes.find((n) => n.id === refNodeId);
        if (refNode) {
          const refPositions = getPortPositions(refNode);

          // Wire from ref node's ref output to this node's ref input
          const path = generateWirePath(
            refPositions.refOutput.x,
            refPositions.refOutput.y,
            sourcePositions.refInput.x,
            sourcePositions.refInput.y
          );

          wires.push(
            <g key={`ref-${refNode.id}-${node.id}`}>
              {/* Glow effect */}
              <path
                d={path}
                fill="none"
                stroke="#a855f7"
                strokeWidth={6}
                strokeLinecap="round"
                opacity={0.3}
                filter="blur(4px)"
              />
              {/* Main wire */}
              <path
                d={path}
                fill="none"
                stroke="#a855f7"
                strokeWidth={3}
                strokeLinecap="round"
                className="transition-all"
              />
              {/* Animated dash overlay */}
              <path
                d={path}
                fill="none"
                stroke="#c084fc"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="8 12"
                className="animate-dash"
              />
            </g>
          );
        }
      });
    }
  });

  if (wires.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
        transformOrigin: '0 0',
      }}
    >
      <defs>
        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {wires}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </svg>
  );
}
