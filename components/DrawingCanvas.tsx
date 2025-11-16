'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import { useStore } from '@/lib/store';

interface DrawingCanvasProps {
  width: number;
  height: number;
  onSave: (imageData: string) => void;
}

export default function DrawingCanvas({ width, height, onSave }: DrawingCanvasProps) {
  const { drawing } = useStore();
  const [lines, setLines] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<any>(null);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, {
      tool: drawing.tool,
      points: [pos.x, pos.y],
      strokeWidth: drawing.brushSize,
      stroke: drawing.tool === 'eraser' ? '#ffffff' : drawing.color,
    }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];

    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines(lines.slice(0, -1).concat(lastLine));
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const saveCanvas = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL();
      onSave(dataURL);
    }
  };

  const clearCanvas = () => {
    setLines([]);
  };

  useEffect(() => {
    // Auto-save periodically
    const interval = setInterval(() => {
      if (lines.length > 0) {
        saveCanvas();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lines]);

  return (
    <div className="relative">
      <Stage
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        ref={stageRef}
        className="border border-zinc-800 rounded-lg bg-white cursor-crosshair"
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>

      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 text-sm"
        >
          Clear
        </button>
        <button
          onClick={saveCanvas}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          Save Sketch
        </button>
      </div>
    </div>
  );
}
