// Canvas Types
export interface CanvasNode {
  id: string;
  type: 'character' | 'scene' | 'sketch' | 'i2i' | 't2i' | 'i2v' | 't2v' | 'lipsync' | 'action-pose' | 'coherent-scene' | 'image' | 'video';
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
  coherentImages?: string[]; // For coherent-scene: array of 6 image URLs/base64
  settings?: {
    creativity?: number; // 0-1
    characterRefs?: string[]; // IDs of character references
    environment?: string; // Environment setting
    actionType?: string; // For scene builder and action-pose (punch/kick/takedown)
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
export type DrawingTool = 'brush' | 'eraser' | 'select' | 'rectangle' | 'circle';

export interface DrawingSettings {
  tool: DrawingTool;
  brushSize: number;
  color: string;
  smoothing?: number; // 0-1 for brush smoothing/stabilization
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

// Writers Room Types
export interface Script {
  id: string;
  userId: string;
  title: string;
  content: string;
  metadata?: ScriptMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScriptMetadata {
  genre?: string;
  estimatedDuration?: number;
  sceneCount?: number;
  characterCount?: number;
  tags?: string[];
}

export interface ScriptCharacter {
  id: string;
  scriptId: string;
  name: string;
  description?: string;
  traits?: string[];
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'extra';
  imageUrl?: string;
  createdAt: Date;
}

export interface ScriptScene {
  id: string;
  scriptId: string;
  sceneNumber: number;
  title?: string;
  content: string;
  location?: string;
  timeOfDay?: 'day' | 'night' | 'dawn' | 'dusk' | 'unknown';
  characters: string[];
  actionBeats?: string[];
  dialogue?: string[];
  createdAt: Date;
}

export interface Storyboard {
  id: string;
  scriptId: string;
  sceneId: string;
  imageUrl: string;
  description: string;
  shotType?: 'wide' | 'medium' | 'close' | 'extreme-close';
  cameraAngle?: string;
  createdAt: Date;
}

export interface ScriptAnalysis {
  scriptId: string;
  readability: number;
  pacing: 'slow' | 'medium' | 'fast';
  actionDensity: number;
  dialogueRatio: number;
  sceneCount: number;
  averageSceneLength: number;
  suggestions: AnalysisSuggestion[];
  createdAt: Date;
}

export interface AnalysisSuggestion {
  type: 'pacing' | 'dialogue' | 'action' | 'character' | 'structure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  location?: {
    scene?: number;
    line?: number;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'fdx' | 'txt' | 'html';
  includeSceneNumbers?: boolean;
  includeCharacterList?: boolean;
  includeStoryboard?: boolean;
}
