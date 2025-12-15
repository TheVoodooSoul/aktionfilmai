'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home, PenTool, MessageSquare, Film, Users, Sparkles,
  Plus, Trash2, BookOpen, Coins, Save, GripVertical,
  Play, Clock, MapPin, Sun, Moon, Sunset, ChevronDown,
  Eye, Swords, Heart, ArrowRight, Send, Image as ImageIcon
} from 'lucide-react';
import { useStore } from '@/lib/store';

// Scene types for action films
const SCENE_TYPES = [
  { id: 'action', name: 'Action', icon: Swords, color: 'bg-red-500' },
  { id: 'dialogue', name: 'Dialogue', icon: MessageSquare, color: 'bg-blue-500' },
  { id: 'chase', name: 'Chase', icon: Play, color: 'bg-orange-500' },
  { id: 'tension', name: 'Tension', icon: Eye, color: 'bg-purple-500' },
  { id: 'emotional', name: 'Emotional', icon: Heart, color: 'bg-pink-500' },
  { id: 'setup', name: 'Setup', icon: MapPin, color: 'bg-green-500' },
];

const TIME_OF_DAY = [
  { id: 'day', name: 'Day', icon: Sun },
  { id: 'night', name: 'Night', icon: Moon },
  { id: 'dawn', name: 'Dawn', icon: Sunset },
  { id: 'dusk', name: 'Dusk', icon: Sunset },
];

interface Scene {
  id: string;
  sceneNumber: number;
  act: 1 | 2 | 3;
  type: string;
  location: string;
  interior: boolean;
  timeOfDay: string;
  characters: string[];
  summary: string;
  beats: string[];
  dialogue: string;
  actionDescription: string;
  duration: number; // estimated minutes
  status: 'outline' | 'draft' | 'revised' | 'final';
  storyboardFrames: string[];
  improvedDialogue?: string;
}

const createEmptyScene = (sceneNumber: number, act: 1 | 2 | 3): Scene => ({
  id: Date.now().toString(),
  sceneNumber,
  act,
  type: 'action',
  location: '',
  interior: true,
  timeOfDay: 'day',
  characters: [],
  summary: '',
  beats: [''],
  dialogue: '',
  actionDescription: '',
  duration: 2,
  status: 'outline',
  storyboardFrames: [],
});

export default function ScenesPage() {
  const { user, credits } = useStore();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [filterAct, setFilterAct] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>([]);

  // Load characters from localStorage
  useEffect(() => {
    const savedChars = localStorage.getItem('writers-room-characters');
    if (savedChars) {
      try {
        const parsed = JSON.parse(savedChars);
        setCharacters(parsed.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (e) {
        console.error('Failed to load characters:', e);
      }
    }
  }, []);

  // Add new scene
  const addScene = (act: 1 | 2 | 3) => {
    const actScenes = scenes.filter(s => s.act === act);
    const newSceneNumber = scenes.length + 1;
    const newScene = createEmptyScene(newSceneNumber, act);
    setScenes(prev => [...prev, newScene]);
    setSelectedScene(newScene);
  };

  // Delete scene
  const deleteScene = (id: string) => {
    setScenes(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Renumber scenes
      return filtered.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    });
    if (selectedScene?.id === id) {
      setSelectedScene(null);
    }
  };

  // Update scene
  const updateScene = (id: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (selectedScene?.id === id) {
      setSelectedScene(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Add beat to scene
  const addBeat = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
      updateScene(sceneId, { beats: [...scene.beats, ''] });
    }
  };

  // Update beat
  const updateBeat = (sceneId: string, beatIndex: number, value: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene) {
      const newBeats = [...scene.beats];
      newBeats[beatIndex] = value;
      updateScene(sceneId, { beats: newBeats });
    }
  };

  // Remove beat
  const removeBeat = (sceneId: string, beatIndex: number) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (scene && scene.beats.length > 1) {
      updateScene(sceneId, { beats: scene.beats.filter((_, i) => i !== beatIndex) });
    }
  };

  // AI generate scene content
  const handleAIGenerate = async (field: 'summary' | 'beats' | 'action') => {
    if (!selectedScene) return;

    setIsGenerating(true);
    try {
      const prompt = field === 'beats'
        ? `Generate 3-5 action beats for this scene: ${selectedScene.summary}. Location: ${selectedScene.interior ? 'INT' : 'EXT'}. ${selectedScene.location}. Characters: ${selectedScene.characters.join(', ')}. Scene type: ${selectedScene.type}. Format as a numbered list.`
        : field === 'action'
        ? `Write vivid action choreography for this scene: ${selectedScene.summary}. Fighting style should match the characters. Location: ${selectedScene.location}. Include specific moves, camera angles, and impacts.`
        : `Generate a compelling scene summary for: Location: ${selectedScene.location}, Type: ${selectedScene.type}, Characters: ${selectedScene.characters.join(', ')}`;

      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: prompt,
          action: 'scene',
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value);

          if (field === 'beats') {
            // Parse numbered list into array
            const beatLines = result.split('\n').filter(l => /^\d+[\.\)]/.test(l.trim()));
            if (beatLines.length > 0) {
              updateScene(selectedScene.id, { beats: beatLines.map(l => l.replace(/^\d+[\.\)]\s*/, '')) });
            }
          } else if (field === 'action') {
            updateScene(selectedScene.id, { actionDescription: result });
          } else {
            updateScene(selectedScene.id, { summary: result });
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to localStorage
  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('writers-room-scenes', JSON.stringify(scenes));
      alert('Scenes saved!');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('writers-room-scenes');
    if (saved) {
      try {
        setScenes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load scenes:', e);
      }
    }
  }, []);

  const getScenesByAct = (act: number) => scenes.filter(s => s.act === act);
  const getSceneType = (id: string) => SCENE_TYPES.find(t => t.id === id);
  const getTimeIcon = (id: string) => TIME_OF_DAY.find(t => t.id === id)?.icon || Sun;

  const filteredScenes = filterAct ? scenes.filter(s => s.act === filterAct) : scenes;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'outline': return 'bg-zinc-600';
      case 'draft': return 'bg-yellow-600';
      case 'revised': return 'bg-blue-600';
      case 'final': return 'bg-green-600';
      default: return 'bg-zinc-600';
    }
  };

  const getTotalDuration = () => scenes.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Left */}
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
            <div className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium flex items-center gap-2">
              <Film size={14} />
              Scenes
            </div>
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
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm mr-2">
                <Coins size={14} className="text-yellow-500" />
                <span className="text-white font-medium">{credits || 0}</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left: Scene List/Cards */}
        <div className="w-96 border-r border-zinc-800 bg-zinc-950 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {/* Stats Bar */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400">{scenes.length} Scenes</span>
              <span className="text-sm text-zinc-400 flex items-center gap-1">
                <Clock size={12} />
                ~{getTotalDuration()} min
              </span>
            </div>
            {/* Act Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterAct(null)}
                className={`flex-1 py-1.5 rounded text-xs font-medium ${filterAct === null ? 'bg-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              >
                All
              </button>
              {[1, 2, 3].map(act => (
                <button
                  key={act}
                  onClick={() => setFilterAct(act)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium ${filterAct === act ? 'bg-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                >
                  Act {act}
                </button>
              ))}
            </div>
          </div>

          {/* Scene Cards by Act */}
          <div className="p-4 space-y-6">
            {[1, 2, 3].map(act => {
              const actScenes = filteredScenes.filter(s => s.act === act);
              if (filterAct && filterAct !== act) return null;

              return (
                <div key={act}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-xs font-bold uppercase tracking-wide ${
                      act === 1 ? 'text-blue-500' : act === 2 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      Act {act} ({actScenes.length} scenes)
                    </h3>
                    <button
                      onClick={() => addScene(act as 1 | 2 | 3)}
                      className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {actScenes.length === 0 ? (
                    <div className="text-center py-4 text-zinc-600 text-sm">
                      No scenes in Act {act}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {actScenes.map((scene) => {
                        const sceneType = getSceneType(scene.type);
                        const TimeIcon = getTimeIcon(scene.timeOfDay);
                        return (
                          <button
                            key={scene.id}
                            onClick={() => setSelectedScene(scene)}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              selectedScene?.id === scene.id
                                ? 'bg-red-600/20 border border-red-600/50 ring-1 ring-red-600/30'
                                : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-zinc-500">#{scene.sceneNumber}</span>
                                <div className={`w-2 h-2 rounded-full mt-1 ${sceneType?.color || 'bg-zinc-600'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-zinc-500">
                                    {scene.interior ? 'INT' : 'EXT'}.
                                  </span>
                                  <span className="font-medium text-sm truncate">
                                    {scene.location || 'No location'}
                                  </span>
                                  <TimeIcon size={12} className="text-zinc-500" />
                                </div>
                                <p className="text-xs text-zinc-400 line-clamp-2">
                                  {scene.summary || 'No summary'}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${getStatusColor(scene.status)}`}>
                                    {scene.status}
                                  </span>
                                  <span className="text-[10px] text-zinc-600">{scene.duration}min</span>
                                  {scene.characters.length > 0 && (
                                    <span className="text-[10px] text-zinc-600">{scene.characters.length} chars</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Scene Editor */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {selectedScene ? (
            <div className="max-w-3xl mx-auto">
              {/* Scene Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-zinc-700">#{selectedScene.sceneNumber}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedScene.interior ? 'INT' : 'EXT'}
                        onChange={(e) => updateScene(selectedScene.id, { interior: e.target.value === 'INT' })}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm font-bold"
                      >
                        <option value="INT">INT.</option>
                        <option value="EXT">EXT.</option>
                      </select>
                      <input
                        type="text"
                        value={selectedScene.location}
                        onChange={(e) => updateScene(selectedScene.id, { location: e.target.value.toUpperCase() })}
                        placeholder="LOCATION"
                        className="bg-transparent border-b border-zinc-700 text-xl font-bold uppercase outline-none focus:border-red-500"
                      />
                      <span className="text-zinc-500">-</span>
                      <select
                        value={selectedScene.timeOfDay}
                        onChange={(e) => updateScene(selectedScene.id, { timeOfDay: e.target.value })}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm uppercase"
                      >
                        {TIME_OF_DAY.map(t => (
                          <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteScene(selectedScene.id)}
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Scene Metadata */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Act</label>
                  <select
                    value={selectedScene.act}
                    onChange={(e) => updateScene(selectedScene.id, { act: parseInt(e.target.value) as 1 | 2 | 3 })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={1}>Act 1</option>
                    <option value={2}>Act 2</option>
                    <option value={3}>Act 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Type</label>
                  <select
                    value={selectedScene.type}
                    onChange={(e) => updateScene(selectedScene.id, { type: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {SCENE_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Duration</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={selectedScene.duration}
                      onChange={(e) => updateScene(selectedScene.id, { duration: parseInt(e.target.value) || 1 })}
                      min={1}
                      max={30}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                    />
                    <span className="text-sm text-zinc-500">min</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Status</label>
                  <select
                    value={selectedScene.status}
                    onChange={(e) => updateScene(selectedScene.id, { status: e.target.value as Scene['status'] })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="outline">Outline</option>
                    <option value="draft">Draft</option>
                    <option value="revised">Revised</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>

              {/* Characters in Scene */}
              <div className="mb-6">
                <label className="text-xs text-zinc-500 uppercase tracking-wide mb-2 block">Characters in Scene</label>
                <div className="flex flex-wrap gap-2">
                  {characters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        const inScene = selectedScene.characters.includes(char.name);
                        updateScene(selectedScene.id, {
                          characters: inScene
                            ? selectedScene.characters.filter(c => c !== char.name)
                            : [...selectedScene.characters, char.name]
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedScene.characters.includes(char.name)
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {char.name || 'Unnamed'}
                    </button>
                  ))}
                  {characters.length === 0 && (
                    <Link href="/writers-room/characters" className="text-sm text-red-500 hover:underline">
                      + Add characters first
                    </Link>
                  )}
                </div>
              </div>

              {/* Scene Summary */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Scene Summary</label>
                  <button
                    onClick={() => handleAIGenerate('summary')}
                    disabled={isGenerating}
                    className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                  >
                    <Sparkles size={10} /> AI Generate
                  </button>
                </div>
                <textarea
                  value={selectedScene.summary}
                  onChange={(e) => updateScene(selectedScene.id, { summary: e.target.value })}
                  placeholder="What happens in this scene? The hero confronts the villain in the warehouse..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Scene Beats */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">Scene Beats</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAIGenerate('beats')}
                      disabled={isGenerating}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Sparkles size={10} /> AI Generate
                    </button>
                    <button
                      onClick={() => addBeat(selectedScene.id)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedScene.beats.map((beat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mt-1">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={beat}
                        onChange={(e) => updateBeat(selectedScene.id, i, e.target.value)}
                        placeholder="What happens..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm"
                      />
                      {selectedScene.beats.length > 1 && (
                        <button
                          onClick={() => removeBeat(selectedScene.id, i)}
                          className="p-2 text-zinc-600 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Description (for action scenes) */}
              {selectedScene.type === 'action' || selectedScene.type === 'chase' ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">Action Choreography</label>
                    <button
                      onClick={() => handleAIGenerate('action')}
                      disabled={isGenerating}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Sparkles size={10} /> AI Generate
                    </button>
                  </div>
                  <textarea
                    value={selectedScene.actionDescription}
                    onChange={(e) => updateScene(selectedScene.id, { actionDescription: e.target.value })}
                    placeholder="Describe the fight choreography, stunts, or chase sequence in detail..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm resize-none font-mono"
                    rows={6}
                  />
                </div>
              ) : null}

              {/* Quick Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                <Link
                  href={`/writers-room/improv?scene=${selectedScene.id}`}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Improv This Scene
                </Link>
                <Link
                  href={`/writers-room/storyboard?scene=${selectedScene.id}`}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon size={16} />
                  Storyboard This Scene
                </Link>
                <Link
                  href="/canvas"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-center transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Send to Canvas
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-zinc-600">
                <Film size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Scene Selected</h3>
                <p className="text-sm mb-4">Select a scene from the list or create a new one</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map(act => (
                    <button
                      key={act}
                      onClick={() => addScene(act as 1 | 2 | 3)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        act === 1 ? 'bg-blue-600 hover:bg-blue-700' :
                        act === 2 ? 'bg-yellow-600 hover:bg-yellow-700' :
                        'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      + Act {act} Scene
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
