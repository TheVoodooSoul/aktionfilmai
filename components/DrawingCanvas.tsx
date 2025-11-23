'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Image as KonvaImage } from 'react-konva';
import { useStore } from '@/lib/store';
import { Paintbrush, Eraser, Square, CircleIcon, Upload, Sliders, Sparkles } from 'lucide-react';

interface DrawingCanvasProps {
  width: number;
  height: number;
  onSave?: (imageData: string, prompt?: string) => void;
  nodeId?: string;
}

interface Shape {
  type: 'line' | 'rectangle' | 'circle';
  tool?: string;
  points?: number[];
  strokeWidth?: number;
  stroke?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
}

export default function DrawingCanvas({ width, height, onSave, nodeId }: DrawingCanvasProps) {
  const { drawing, setDrawing, credits, setCredits } = useStore();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoPreview, setAutoPreview] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);

  // Generation settings
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [seed, setSeed] = useState(-1);

  const stageRef = useRef<any>(null);
  const smoothPoints = useRef<number[]>([]);

  // Smooth the drawing points (like Illustrator brush smoothing)
  const smoothLine = (points: number[], smoothing: number) => {
    if (points.length < 4) return points;

    const result: number[] = [];
    const tension = 1 - (smoothing || 0.5);

    for (let i = 0; i < points.length - 2; i += 2) {
      const x0 = i === 0 ? points[i] : points[i - 2];
      const y0 = i === 0 ? points[i + 1] : points[i - 1];
      const x1 = points[i];
      const y1 = points[i + 1];
      const x2 = points[i + 2];
      const y2 = points[i + 3];

      result.push(
        x0 + (x1 - x0) * tension,
        y0 + (y1 - y0) * tension
      );
    }

    return result.length > 0 ? result : points;
  };

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();

    if (drawing.tool === 'brush' || drawing.tool === 'eraser') {
      smoothPoints.current = [pos.x, pos.y];
      const newShape: Shape = {
        type: 'line',
        tool: drawing.tool,
        points: [pos.x, pos.y],
        strokeWidth: drawing.brushSize,
        stroke: drawing.tool === 'eraser' ? '#ffffff' : drawing.color,
      };
      setCurrentShape(newShape);
    } else if (drawing.tool === 'rectangle') {
      setCurrentShape({
        type: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: drawing.color,
        strokeWidth: drawing.brushSize,
        fill: 'transparent',
      });
    } else if (drawing.tool === 'circle') {
      setCurrentShape({
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 0,
        stroke: drawing.color,
        strokeWidth: drawing.brushSize,
        fill: 'transparent',
      });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (drawing.tool === 'brush' || drawing.tool === 'eraser') {
      smoothPoints.current = smoothPoints.current.concat([point.x, point.y]);
      const smoothed = smoothLine(smoothPoints.current, drawing.smoothing || 0.5);

      setCurrentShape({
        ...currentShape,
        points: smoothed,
      });
    } else if (drawing.tool === 'rectangle' && currentShape) {
      const width = point.x - currentShape.x;
      const height = point.y - currentShape.y;
      setCurrentShape({
        ...currentShape,
        width,
        height,
      });
    } else if (drawing.tool === 'circle' && currentShape) {
      const radius = Math.sqrt(
        Math.pow(point.x - currentShape.x, 2) + Math.pow(point.y - currentShape.y, 2)
      );
      setCurrentShape({
        ...currentShape,
        radius,
      });
    }
  };

  const handleMouseUp = () => {
    if (currentShape) {
      setShapes([...shapes, currentShape]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
    smoothPoints.current = [];
  };

  const saveCanvas = (includePrompt?: boolean) => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL();
      if (onSave) {
        if (includePrompt && nodeId) {
          // Pass back both image and prompt
          onSave(dataURL, prompt);
        } else {
          onSave(dataURL);
        }
      }
      return dataURL;
    }
    return null;
  };

  const clearCanvas = () => {
    setShapes([]);
    setCurrentShape(null);
    setPreviewImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setUploadedImage(img);
      };
    };
    reader.readAsDataURL(file);
  };

  const generatePreview = async () => {
    if (credits < 1) {
      alert('Insufficient credits! You need 1 credit for preview.');
      return;
    }

    setIsGenerating(true);
    try {
      const imageData = saveCanvas();
      if (!imageData) return;

      const response = await fetch('/api/runcomfy/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          prompt,
          style,
          aspectRatio,
          seed: seed === -1 ? Math.floor(Math.random() * 1000000) : seed,
          creativity: drawing.smoothing || 0.5,
        }),
      });

      const data = await response.json();
      if (data.output_url) {
        setPreviewImage(data.output_url);
        setCredits(credits - 1);
      } else {
        alert('Failed to generate preview: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      alert('Failed to generate preview. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-update preview every 1-2 minutes if enabled
  useEffect(() => {
    if (!autoPreview || shapes.length === 0) return;

    const interval = setInterval(() => {
      if (credits >= 1) {
        generatePreview();
      }
    }, 90000); // 1.5 minutes

    return () => clearInterval(interval);
  }, [autoPreview, shapes, credits]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Drawing Tools - Above Canvas */}
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <div className="flex gap-2">
          <button
            onClick={() => setDrawing({ tool: 'brush' })}
            className={`p-2 rounded transition-colors ${
              drawing.tool === 'brush'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="Brush"
          >
            <Paintbrush size={18} />
          </button>
          <button
            onClick={() => setDrawing({ tool: 'eraser' })}
            className={`p-2 rounded transition-colors ${
              drawing.tool === 'eraser'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
          <button
            onClick={() => setDrawing({ tool: 'rectangle' })}
            className={`p-2 rounded transition-colors ${
              drawing.tool === 'rectangle'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="Rectangle"
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => setDrawing({ tool: 'circle' })}
            className={`p-2 rounded transition-colors ${
              drawing.tool === 'circle'
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="Circle"
          >
            <CircleIcon size={18} />
          </button>
        </div>

        <div className="h-8 w-px bg-zinc-700"></div>

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Size:</span>
          <input
            type="range"
            min="1"
            max="50"
            value={drawing.brushSize}
            onChange={(e) => setDrawing({ brushSize: parseInt(e.target.value) })}
            className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-white w-8">{drawing.brushSize}</span>
        </div>

        <div className="h-8 w-px bg-zinc-700"></div>

        {/* Smoothing */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Smooth:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={(drawing.smoothing || 0.5) * 100}
            onChange={(e) => setDrawing({ smoothing: parseInt(e.target.value) / 100 })}
            className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-white w-8">{Math.round((drawing.smoothing || 0.5) * 100)}</span>
        </div>

        <div className="h-8 w-px bg-zinc-700"></div>

        {/* Color Picker */}
        {drawing.tool !== 'eraser' && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={drawing.color}
              onChange={(e) => setDrawing({ color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border border-zinc-700"
            />
          </div>
        )}

        <div className="h-8 w-px bg-zinc-700"></div>

        {/* Image Upload */}
        <label className="p-2 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 cursor-pointer transition-colors" title="Upload Image">
          <Upload size={18} />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <div className="h-8 w-px bg-zinc-700"></div>

        {/* Clear */}
        <button
          onClick={clearCanvas}
          className="px-3 py-1.5 text-xs bg-zinc-800 text-white rounded hover:bg-zinc-700"
        >
          Clear
        </button>
      </div>

      {/* Canvas Container with Preview */}
      <div className="relative">
        {/* Preview Image - Bottom Left Corner */}
        {previewImage && (
          <div className="absolute -left-2 top-full mt-2 z-10 border-2 border-red-500 rounded-lg overflow-hidden shadow-xl">
            <img
              src={previewImage}
              alt="Preview"
              className="w-48 h-auto"
            />
            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
              PREVIEW
            </div>
          </div>
        )}

        {/* Main Canvas */}
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
          className="border-2 border-zinc-700 rounded-lg bg-white cursor-crosshair shadow-lg"
        >
          <Layer>
            {/* Uploaded Image */}
            {uploadedImage && (
              <KonvaImage
                image={uploadedImage}
                width={width}
                height={height}
                opacity={0.3}
              />
            )}

            {/* Render all saved shapes */}
            {shapes.map((shape, i) => {
              if (shape.type === 'line') {
                return (
                  <Line
                    key={i}
                    points={shape.points}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      shape.tool === 'eraser' ? 'destination-out' : 'source-over'
                    }
                  />
                );
              } else if (shape.type === 'rectangle') {
                return (
                  <Rect
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                  />
                );
              } else if (shape.type === 'circle') {
                return (
                  <Circle
                    key={i}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                  />
                );
              }
              return null;
            })}

            {/* Render current shape being drawn */}
            {currentShape && currentShape.type === 'line' && (
              <Line
                points={currentShape.points}
                stroke={currentShape.stroke}
                strokeWidth={currentShape.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  currentShape.tool === 'eraser' ? 'destination-out' : 'source-over'
                }
              />
            )}
            {currentShape && currentShape.type === 'rectangle' && (
              <Rect
                x={currentShape.x}
                y={currentShape.y}
                width={currentShape.width}
                height={currentShape.height}
                stroke={currentShape.stroke}
                strokeWidth={currentShape.strokeWidth}
                fill={currentShape.fill}
              />
            )}
            {currentShape && currentShape.type === 'circle' && (
              <Circle
                x={currentShape.x}
                y={currentShape.y}
                radius={currentShape.radius}
                stroke={currentShape.stroke}
                strokeWidth={currentShape.strokeWidth}
                fill={currentShape.fill}
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Prompt Box */}
      <div className="space-y-2">
        <label className="text-sm text-zinc-400">Your paragraph text</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your action scene..."
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
          rows={3}
        />
      </div>

      {/* Info Tab - Style, Aspect Ratio, Seed */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-600"
          >
            <option value="realistic">Realistic</option>
            <option value="anime">Anime</option>
            <option value="comic">Comic</option>
            <option value="sketch">Sketch</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Aspect Ratio</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-red-600"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
            <option value="4:3">4:3</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value))}
            placeholder="-1 (random)"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Preview and Generate Buttons */}
      <div className="flex gap-3">
        <button
          onClick={generatePreview}
          disabled={isGenerating || credits < 1}
          className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              PREVIEW (1 credit)
            </>
          )}
        </button>

        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={autoPreview}
            onChange={(e) => setAutoPreview(e.target.checked)}
            className="rounded"
          />
          Auto-update (1-2 min)
        </label>

        <button
          onClick={() => {
            saveCanvas(true);
          }}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
