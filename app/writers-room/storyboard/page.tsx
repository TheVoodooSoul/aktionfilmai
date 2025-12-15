'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Home, PenTool, MessageSquare, Film,
  Plus, Trash2, Download, Sparkles, Loader2,
  ChevronDown, Image as ImageIcon, Coins, BookOpen, Users,
  Video, Play, Clock
} from 'lucide-react';
import { useStore } from '@/lib/store';

interface StoryboardFrame {
  id: string;
  description: string;
  shotType: 'wide' | 'medium' | 'close' | 'extreme-close' | 'over-shoulder' | 'low-angle' | 'high-angle' | 'dutch';
  style: 'sketch' | 'comic' | 'cinematic' | 'anime' | 'realistic';
  imageUrl?: string;
  videoUrl?: string;
  isGenerating?: boolean;
  isGeneratingVideo?: boolean;
}

const SHOT_TYPES = [
  { value: 'wide', label: 'Wide Shot', desc: 'Full scene visible' },
  { value: 'medium', label: 'Medium Shot', desc: 'Waist up' },
  { value: 'close', label: 'Close-up', desc: 'Face & shoulders' },
  { value: 'extreme-close', label: 'Extreme Close-up', desc: 'Eyes or detail' },
  { value: 'over-shoulder', label: 'Over Shoulder', desc: 'POV framing' },
  { value: 'low-angle', label: 'Low Angle', desc: 'Looking up, powerful' },
  { value: 'high-angle', label: 'High Angle', desc: 'Looking down' },
  { value: 'dutch', label: 'Dutch Angle', desc: 'Tilted, tension' },
];

const STYLES = [
  { value: 'cinematic', label: 'Cinematic', desc: 'Film noir lighting' },
  { value: 'sketch', label: 'Sketch', desc: 'Pencil storyboard' },
  { value: 'comic', label: 'Comic', desc: 'Bold lines, high contrast' },
  { value: 'anime', label: 'Anime', desc: 'Japanese animation' },
  { value: 'realistic', label: 'Realistic', desc: 'Photo-realistic' },
];

export default function StoryboardPage() {
  const { user, credits, setCredits } = useStore();
  const [frames, setFrames] = useState<StoryboardFrame[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [scriptInput, setScriptInput] = useState('');
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [timeline, setTimeline] = useState<string[]>([]); // Array of video URLs for timeline
  const [showTimeline, setShowTimeline] = useState(false);

  // Add new empty frame
  const addFrame = () => {
    const newFrame: StoryboardFrame = {
      id: Date.now().toString(),
      description: '',
      shotType: 'medium',
      style: selectedStyle as any,
    };
    setFrames([...frames, newFrame]);
  };

  // Update frame
  const updateFrame = (id: string, updates: Partial<StoryboardFrame>) => {
    setFrames(frames.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // Delete frame
  const deleteFrame = (id: string) => {
    setFrames(frames.filter(f => f.id !== id));
  };

  // Generate single frame
  const generateFrame = async (frame: StoryboardFrame) => {
    if (!frame.description.trim()) {
      alert('Please add a description for this frame');
      return;
    }

    updateFrame(frame.id, { isGenerating: true });

    try {
      const response = await fetch('/api/replicate/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: frame.description,
          shotType: frame.shotType,
          style: frame.style,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.output_url) {
        updateFrame(frame.id, { imageUrl: data.output_url, isGenerating: false });
        // Update credits display
        if (credits && data.credits_used) {
          setCredits(credits - data.credits_used);
        }
      } else {
        alert(data.error || 'Failed to generate frame');
        updateFrame(frame.id, { isGenerating: false });
      }
    } catch (error) {
      console.error('Generate frame error:', error);
      alert('Failed to generate frame');
      updateFrame(frame.id, { isGenerating: false });
    }
  };

  // Generate video from frame image (using A2E i2v)
  const generateVideo = async (frame: StoryboardFrame) => {
    if (!frame.imageUrl) {
      alert('Generate the image first');
      return;
    }

    if (credits < 100) {
      alert('Insufficient credits! Image to video costs 100 credits.');
      return;
    }

    updateFrame(frame.id, { isGeneratingVideo: true });

    try {
      const response = await fetch('/api/a2e/i2v', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: frame.imageUrl,
          prompt: frame.description,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.output_url) {
        updateFrame(frame.id, { videoUrl: data.output_url, isGeneratingVideo: false });
        setCredits(credits - 100);
      } else {
        alert(data.error || 'Failed to generate video');
        updateFrame(frame.id, { isGeneratingVideo: false });
      }
    } catch (error) {
      console.error('Generate video error:', error);
      alert('Failed to generate video');
      updateFrame(frame.id, { isGeneratingVideo: false });
    }
  };

  // Add video to timeline
  const addToTimeline = (videoUrl: string) => {
    if (!timeline.includes(videoUrl)) {
      setTimeline([...timeline, videoUrl]);
      setShowTimeline(true);
    }
  };

  // Remove from timeline
  const removeFromTimeline = (index: number) => {
    setTimeline(timeline.filter((_, i) => i !== index));
  };

  // Export timeline as concatenated video list
  const exportTimeline = () => {
    if (timeline.length === 0) {
      alert('Add videos to timeline first');
      return;
    }

    // Create a JSON file with video URLs for external editor
    const data = {
      videos: timeline,
      exportedAt: new Date().toISOString(),
      totalClips: timeline.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeline-export.json';
    a.click();
  };

  // Generate all frames
  const generateAllFrames = async () => {
    const framesToGenerate = frames.filter(f => f.description.trim() && !f.imageUrl);
    if (framesToGenerate.length === 0) {
      alert('Add descriptions to frames first');
      return;
    }

    setIsGeneratingAll(true);

    for (const frame of framesToGenerate) {
      await generateFrame(frame);
    }

    setIsGeneratingAll(false);
  };

  // AI breakdown from script
  const breakdownScript = async () => {
    if (!scriptInput.trim()) {
      alert('Paste your script first');
      return;
    }

    setShowAIBreakdown(true);

    try {
      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptInput,
          action: 'storyboard',
          userId: user?.id,
        }),
      });

      // For now, create placeholder frames
      // TODO: Parse AI response into actual frames
      const placeholderFrames: StoryboardFrame[] = [
        { id: '1', description: 'Opening shot - establish location', shotType: 'wide', style: selectedStyle as any },
        { id: '2', description: 'Character enters frame', shotType: 'medium', style: selectedStyle as any },
        { id: '3', description: 'Close on character reaction', shotType: 'close', style: selectedStyle as any },
        { id: '4', description: 'Action sequence begins', shotType: 'medium', style: selectedStyle as any },
      ];

      setFrames(placeholderFrames);
    } catch (error) {
      console.error('Script breakdown error:', error);
    } finally {
      setShowAIBreakdown(false);
    }
  };

  // Export storyboard
  const exportStoryboard = () => {
    const framesWithImages = frames.filter(f => f.imageUrl);
    if (framesWithImages.length === 0) {
      alert('Generate some frames first');
      return;
    }

    // Create a simple HTML export
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Storyboard Export</title>
      <style>
        body { font-family: sans-serif; background: #111; color: white; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .frame { background: #222; border-radius: 8px; overflow: hidden; }
        .frame img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
        .frame-info { padding: 12px; }
        .frame-num { font-size: 12px; color: #888; }
        .frame-desc { margin-top: 4px; }
        .frame-shot { font-size: 11px; color: #666; margin-top: 4px; }
      </style>
      </head>
      <body>
        <h1>Storyboard</h1>
        <div class="grid">
          ${framesWithImages.map((f, i) => `
            <div class="frame">
              <img src="${f.imageUrl}" alt="Frame ${i + 1}">
              <div class="frame-info">
                <div class="frame-num">Frame ${i + 1}</div>
                <div class="frame-desc">${f.description}</div>
                <div class="frame-shot">${f.shotType} shot</div>
              </div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard.html';
    a.click();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left: Navigation */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              <Home size={20} />
            </Link>
            <div className="h-4 w-px bg-zinc-800" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              WRITERS ROOM
            </h1>
          </div>

          {/* Center: Mode Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <Link
              href="/writers-room/structure"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <BookOpen size={14} />
              Structure
            </Link>
            <Link
              href="/writers-room/characters"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Users size={14} />
              Characters
            </Link>
            <Link
              href="/writers-room/scenes"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Film size={14} />
              Scenes
            </Link>
            <Link
              href="/writers-room"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <PenTool size={14} />
              Script
            </Link>
            <Link
              href="/writers-room/improv"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <MessageSquare size={14} />
              Improv
            </Link>
            <div className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium flex items-center gap-2">
              <ImageIcon size={14} />
              Storyboard
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm mr-2">
                <Coins size={14} className="text-yellow-500" />
                <span className="text-white font-medium">{credits || 0}</span>
              </div>
            )}
            {/* Timeline Toggle */}
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showTimeline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              <Clock size={16} />
              Timeline {timeline.length > 0 && `(${timeline.length})`}
            </button>
            <button
              onClick={exportStoryboard}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Script Input Section */}
        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles size={16} className="text-red-500" />
              AI Script Breakdown
            </h2>
            <span className="text-xs text-zinc-500">Paste script to auto-generate storyboard frames</span>
          </div>
          <textarea
            value={scriptInput}
            onChange={(e) => setScriptInput(e.target.value)}
            placeholder="Paste your script or scene here... The AI will break it down into storyboard frames."
            className="w-full h-32 px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none font-mono text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">Default Style:</span>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm focus:outline-none"
              >
                {STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={breakdownScript}
              disabled={showAIBreakdown || !scriptInput.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {showAIBreakdown ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Breaking down...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Break Down Script
                </>
              )}
            </button>
          </div>
        </div>

        {/* Frames Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">Storyboard Frames</h2>
            <span className="text-sm text-zinc-500">{frames.length} frames</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addFrame}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Frame
            </button>
            {frames.length > 0 && (
              <button
                onClick={generateAllFrames}
                disabled={isGeneratingAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {isGeneratingAll ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate All (15 cr)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Frames Grid */}
        {frames.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-lg">
            <Film size={48} className="mx-auto text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-zinc-600 mb-2">No Frames Yet</h3>
            <p className="text-zinc-500 mb-4">Paste a script above or add frames manually</p>
            <button
              onClick={addFrame}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add First Frame
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frames.map((frame, index) => (
              <div
                key={frame.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden"
              >
                {/* Frame Preview */}
                <div className="aspect-video bg-black relative group">
                  {frame.videoUrl ? (
                    <video
                      src={frame.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : frame.imageUrl ? (
                    <Image
                      src={frame.imageUrl}
                      alt={`Frame ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : frame.isGenerating || frame.isGeneratingVideo ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-red-500" />
                      <span className="text-xs text-zinc-500 mt-2">
                        {frame.isGeneratingVideo ? 'Generating video...' : 'Generating image...'}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon size={32} className="text-zinc-700" />
                    </div>
                  )}

                  {/* Frame number badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-xs font-bold rounded flex items-center gap-1">
                    {index + 1}
                    {frame.videoUrl && <Video size={10} className="text-blue-400" />}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteFrame(frame.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Add to timeline button - shown when video exists */}
                  {frame.videoUrl && (
                    <button
                      onClick={() => addToTimeline(frame.videoUrl!)}
                      className={`absolute bottom-2 right-2 p-1.5 rounded transition-all ${
                        timeline.includes(frame.videoUrl)
                          ? 'bg-blue-600 text-white'
                          : 'bg-black/70 hover:bg-blue-600 text-white opacity-0 group-hover:opacity-100'
                      }`}
                      title={timeline.includes(frame.videoUrl) ? 'In timeline' : 'Add to timeline'}
                    >
                      <Clock size={14} />
                    </button>
                  )}
                </div>

                {/* Frame Controls */}
                <div className="p-3 space-y-2">
                  <textarea
                    value={frame.description}
                    onChange={(e) => updateFrame(frame.id, { description: e.target.value })}
                    placeholder="Describe this shot..."
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 resize-none"
                    rows={2}
                  />

                  <div className="flex gap-2">
                    <select
                      value={frame.shotType}
                      onChange={(e) => updateFrame(frame.id, { shotType: e.target.value as any })}
                      className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs focus:outline-none"
                    >
                      {SHOT_TYPES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    <select
                      value={frame.style}
                      onChange={(e) => updateFrame(frame.id, { style: e.target.value as any })}
                      className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs focus:outline-none"
                    >
                      {STYLES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => generateFrame(frame)}
                    disabled={frame.isGenerating || !frame.description.trim()}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {frame.isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : frame.imageUrl ? (
                      <>
                        <Sparkles size={14} />
                        Regenerate (2 cr)
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate (2 cr)
                      </>
                    )}
                  </button>

                  {/* Video Generation Button - shown when image exists */}
                  {frame.imageUrl && (
                    <button
                      onClick={() => generateVideo(frame)}
                      disabled={frame.isGeneratingVideo}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {frame.isGeneratingVideo ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Creating video...
                        </>
                      ) : frame.videoUrl ? (
                        <>
                          <Video size={14} />
                          Regenerate Video (100 cr)
                        </>
                      ) : (
                        <>
                          <Video size={14} />
                          Image → Video (100 cr)
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pricing Info */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Storyboard Pricing</h3>
          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              Single Frame: 2 credits
            </span>
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-500" />
              Batch (up to 10): 15 credits
            </span>
            <span className="flex items-center gap-1">
              <Coins size={12} className="text-blue-500" />
              Image → Video: 100 credits
            </span>
            <span className="text-zinc-600">|</span>
            <span>Powered by SDXL Lightning & A2E</span>
          </div>
        </div>
      </div>

      {/* Timeline Panel - Fixed at bottom */}
      {showTimeline && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 z-50">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-blue-500" />
                <h3 className="font-semibold">Video Timeline</h3>
                <span className="text-xs text-zinc-500">{timeline.length} clips</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportTimeline}
                  disabled={timeline.length === 0}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download size={14} />
                  Export Timeline
                </button>
                <button
                  onClick={() => setShowTimeline(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                >
                  <Trash2 size={14} className="text-zinc-500" />
                </button>
              </div>
            </div>

            {timeline.length === 0 ? (
              <div className="text-center py-6 text-zinc-600 text-sm">
                <Clock size={24} className="mx-auto mb-2 opacity-50" />
                <p>No clips in timeline. Generate videos and click the clock icon to add them.</p>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {timeline.map((videoUrl, index) => (
                  <div
                    key={index}
                    className="relative flex-shrink-0 w-40 aspect-video bg-black rounded overflow-hidden border border-zinc-700 group"
                  >
                    <video src={videoUrl} className="w-full h-full object-cover" muted />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded">
                      {index + 1}
                    </div>
                    <button
                      onClick={() => removeFromTimeline(index)}
                      className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
