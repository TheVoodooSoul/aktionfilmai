import { create } from 'zustand';
import { CanvasNode, CanvasState, DrawingSettings } from './types';

interface AppState {
  // User state
  user: any | null;
  credits: number;
  setUser: (user: any) => void;
  setCredits: (credits: number) => void;

  // Canvas state
  canvas: CanvasState;
  setCanvas: (canvas: CanvasState) => void;
  addNode: (node: CanvasNode) => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;

  // Drawing state
  drawing: DrawingSettings;
  setDrawing: (drawing: Partial<DrawingSettings>) => void;

  // Character references
  characterRefs: any[];
  setCharacterRefs: (refs: any[]) => void;
}

export const useStore = create<AppState>((set) => ({
  // User state
  user: null,
  credits: 0,
  setUser: (user) => set({ user }),
  setCredits: (credits) => set({ credits }),

  // Canvas state
  canvas: {
    nodes: [],
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    selectedNodeId: null,
  },
  setCanvas: (canvas) => set({ canvas }),
  addNode: (node) => set((state) => ({
    canvas: {
      ...state.canvas,
      nodes: [...state.canvas.nodes, node],
    },
  })),
  updateNode: (id, updates) => set((state) => ({
    canvas: {
      ...state.canvas,
      nodes: state.canvas.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    },
  })),
  deleteNode: (id) => set((state) => ({
    canvas: {
      ...state.canvas,
      nodes: state.canvas.nodes.filter((node) => node.id !== id),
    },
  })),
  selectNode: (id) => set((state) => ({
    canvas: {
      ...state.canvas,
      selectedNodeId: id,
    },
  })),

  // Drawing state
  drawing: {
    tool: 'brush',
    brushSize: 5,
    color: '#000000',
  },
  setDrawing: (drawing) => set((state) => ({
    drawing: { ...state.drawing, ...drawing },
  })),

  // Character references
  characterRefs: [],
  setCharacterRefs: (refs) => set({ characterRefs: refs }),
}));
