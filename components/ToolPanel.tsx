'use client';

import { useStore } from '@/lib/store';
import { Paintbrush, Eraser, Sliders } from 'lucide-react';

export default function ToolPanel() {
  const { drawing, setDrawing } = useStore();

  return (
    <div className="flex flex-col gap-6 p-6 bg-black border border-zinc-800 rounded-lg w-64">
      <h3 className="text-white font-semibold text-lg">Tools</h3>

      {/* Tool Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setDrawing({ tool: 'brush' })}
          className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            drawing.tool === 'brush'
              ? 'bg-red-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Paintbrush size={18} />
          <span className="text-sm">Brush</span>
        </button>
        <button
          onClick={() => setDrawing({ tool: 'eraser' })}
          className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            drawing.tool === 'eraser'
              ? 'bg-red-600 text-white'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
          }`}
        >
          <Eraser size={18} />
          <span className="text-sm">Eraser</span>
        </button>
      </div>

      {/* Brush Size */}
      <div className="space-y-2">
        <label className="text-zinc-400 text-sm flex items-center justify-between">
          <span>Line Thickness</span>
          <span className="text-white font-medium">{drawing.brushSize}px</span>
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={drawing.brushSize}
          onChange={(e) => setDrawing({ brushSize: parseInt(e.target.value) })}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider-red"
        />
        <div className="flex justify-between text-xs text-zinc-600">
          <span>1px</span>
          <span>50px</span>
        </div>
      </div>

      {/* Color Picker (only for brush) */}
      {drawing.tool === 'brush' && (
        <div className="space-y-2">
          <label className="text-zinc-400 text-sm">Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={drawing.color}
              onChange={(e) => setDrawing({ color: e.target.value })}
              className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-2 border-zinc-800"
            />
            <div className="flex gap-2">
              {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'].map((color) => (
                <button
                  key={color}
                  onClick={() => setDrawing({ color })}
                  className="w-8 h-8 rounded-lg border-2 border-zinc-800 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Creativity Gauge */}
      <div className="space-y-2 pt-4 border-t border-zinc-800">
        <label className="text-zinc-400 text-sm flex items-center gap-2">
          <Sliders size={16} />
          <span>AI Creativity</span>
        </label>
        <div className="text-center text-2xl font-bold text-red-500 mb-2">
          {Math.round((drawing.brushSize / 50) * 100)}%
        </div>
        <div className="text-xs text-zinc-500 text-center">
          Controls how creative the AI is with your sketch
        </div>
      </div>
    </div>
  );
}
