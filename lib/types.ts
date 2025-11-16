// Canvas Types
export interface CanvasNode {
  id: string;
  type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 't2v' | 'lipsync' | 'image' | 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  imageData?: string; // Base64 image data
  imageUrl?: string; // Generated image URL
  videoUrl?: string; // Generated video URL
  audioUrl?: string; // Audio for lipsync
  prompt?: string;
  dialogue?: string; // For lipsync node
  settings?: {
    creativity?: number; // 0-1
    characterRefs?: string[]; // IDs of character references
    environment?: string; // Environment setting
    actionType?: string; // For scene builder
  };
  connections?: {
    next?: string; // ID of next node for sequences
  };
}

export interface CanvasState {
  nodes: CanvasNode[];
  scale: number;
  offsetX: number;
  offsetY: number;
  selectedNodeId: string | null;
}

// Drawing Tool Types
export type DrawingTool = 'brush' | 'eraser' | 'select';

export interface DrawingSettings {
  tool: DrawingTool;
  brushSize: number;
  color: string;
}

// API Types
export interface RunComfyRequest {
  workflow_id: string;
  input: {
    image?: string;
    prompt?: string;
    creativity?: number;
    character_refs?: string[];
    first_frame?: string;
    last_frame?: string;
  };
}

export interface RunComfyResponse {
  output_url: string;
  status: 'success' | 'error';
  message?: string;
}
