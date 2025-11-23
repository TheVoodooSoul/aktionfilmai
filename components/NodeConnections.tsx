'use client';

import React from 'react';
import { CanvasNode } from '@/lib/types';

interface NodeConnectionsProps {
  nodes: CanvasNode[];
  characterRefs: { id: string; name: string; image_url: string; x?: number; y?: number }[];
}

export default function NodeConnections({ nodes, characterRefs }: NodeConnectionsProps) {
  // Draw SVG lines between connected nodes
  const renderConnections = () => {
    const lines: React.ReactElement[] = [];

    // Draw character reference connections
    nodes.forEach((node) => {
      if (node.settings?.characterRefs && node.settings.characterRefs.length > 0) {
        node.settings.characterRefs.forEach((refId) => {
          const ref = characterRefs.find(r => r.id === refId);
          if (ref && ref.x !== undefined && ref.y !== undefined) {
            // Draw line from character ref to node
            const x1 = ref.x + 80; // Character ref width/2
            const y1 = ref.y + 80; // Character ref height/2
            const x2 = node.x + 160; // Node width/2
            const y2 = node.y + 50; // Node top connection point

            lines.push(
              <g key={`ref-${refId}-${node.id}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
                <circle cx={x2} cy={y2} r="4" fill="#ef4444" />
              </g>
            );
          }
        });
      }

      // Draw sequence connections (node to node)
      if (node.connections?.next) {
        const nextNode = nodes.find(n => n.id === node.connections?.next);
        if (nextNode) {
          const x1 = node.x + 160; // Center of current node
          const y1 = node.y + 400; // Bottom of current node
          const x2 = nextNode.x + 160; // Center of next node
          const y2 = nextNode.y + 50; // Top of next node

          // Draw curved line for sequence connection
          const midY = (y1 + y2) / 2;
          const path = `M ${x1} ${y1} Q ${x1} ${midY}, ${(x1 + x2) / 2} ${midY} Q ${x2} ${midY}, ${x2} ${y2}`;

          lines.push(
            <g key={`seq-${node.id}-${nextNode.id}`}>
              <path
                d={path}
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
                opacity="0.7"
              />
              <circle cx={x1} cy={y1} r="5" fill="#10b981" />
              <circle cx={x2} cy={y2} r="5" fill="#10b981" />
              <text
                x={(x1 + x2) / 2}
                y={midY - 10}
                fill="#10b981"
                fontSize="12"
                textAnchor="middle"
              >
                sequence
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
      {renderConnections()}
    </svg>
  );
}
