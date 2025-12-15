'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home, PenTool, MessageSquare, Film, Users, Sparkles,
  Plus, Trash2, BookOpen, Coins, Save, User, Heart,
  Swords, Target, Shield, Brain, Zap, ChevronDown, ChevronRight,
  ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { useStore } from '@/lib/store';

// Character archetypes for action films
const CHARACTER_ARCHETYPES = [
  { id: 'hero', name: 'Hero', icon: Shield, color: 'text-blue-500' },
  { id: 'villain', name: 'Villain', icon: Swords, color: 'text-red-500' },
  { id: 'mentor', name: 'Mentor', icon: Brain, color: 'text-purple-500' },
  { id: 'ally', name: 'Ally', icon: Users, color: 'text-green-500' },
  { id: 'love-interest', name: 'Love Interest', icon: Heart, color: 'text-pink-500' },
  { id: 'rival', name: 'Rival', icon: Zap, color: 'text-yellow-500' },
  { id: 'henchman', name: 'Henchman', icon: Target, color: 'text-orange-500' },
];

interface CharacterArc {
  beginning: string; // Who they are at start
  midpoint: string;  // How they're challenged
  end: string;       // Who they become
}

interface Character {
  id: string;
  name: string;
  archetype: string;
  age: string;
  description: string;
  backstory: string;
  motivation: string;
  flaw: string;
  skills: string[];
  fightingStyle: string;
  arc: CharacterArc;
  relationships: { characterId: string; type: string; description: string }[];
  imageUrl?: string;
  isExpanded: boolean;
}

const createEmptyCharacter = (): Character => ({
  id: Date.now().toString(),
  name: '',
  archetype: 'hero',
  age: '',
  description: '',
  backstory: '',
  motivation: '',
  flaw: '',
  skills: [],
  fightingStyle: '',
  arc: { beginning: '', midpoint: '', end: '' },
  relationships: [],
  isExpanded: true,
});

export default function CharactersPage() {
  const { user, credits } = useStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Add a new character
  const addCharacter = () => {
    const newChar = createEmptyCharacter();
    setCharacters(prev => [...prev, newChar]);
    setSelectedCharacter(newChar);
  };

  // Delete a character
  const deleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }
  };

  // Update character field
  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Add skill to character
  const addSkill = (charId: string) => {
    if (!newSkill.trim()) return;
    const char = characters.find(c => c.id === charId);
    if (char) {
      updateCharacter(charId, { skills: [...char.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  // Remove skill
  const removeSkill = (charId: string, skillIndex: number) => {
    const char = characters.find(c => c.id === charId);
    if (char) {
      updateCharacter(charId, { skills: char.skills.filter((_, i) => i !== skillIndex) });
    }
  };

  // AI generate character details
  const handleAIGenerate = async (field: 'backstory' | 'motivation' | 'flaw' | 'arc') => {
    if (!selectedCharacter) return;

    setIsGenerating(true);
    try {
      const prompt = field === 'arc'
        ? `Generate a character arc for ${selectedCharacter.name}, a ${selectedCharacter.archetype} in an action film. They are: ${selectedCharacter.description}. Format as JSON with beginning, midpoint, end.`
        : `Generate a compelling ${field} for ${selectedCharacter.name}, a ${selectedCharacter.archetype} in an action film. They are: ${selectedCharacter.description}`;

      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: prompt,
          action: 'character',
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

          if (field === 'arc') {
            try {
              const arcData = JSON.parse(result);
              updateCharacter(selectedCharacter.id, { arc: arcData });
            } catch {
              // Still streaming, wait for complete JSON
            }
          } else {
            updateCharacter(selectedCharacter.id, { [field]: result });
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
      localStorage.setItem('writers-room-characters', JSON.stringify(characters));
      alert('Characters saved!');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem('writers-room-characters');
    if (saved) {
      try {
        setCharacters(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load characters:', e);
      }
    }
  }, []);

  const getArchetype = (id: string) => CHARACTER_ARCHETYPES.find(a => a.id === id);

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
            <div className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium flex items-center gap-2">
              <Users size={14} />
              Characters
            </div>
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
          </div>

          {/* Right: Actions */}
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
        {/* Left: Character List */}
        <div className="w-72 border-r border-zinc-800 bg-zinc-950 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-wide">Characters</h3>
            <button
              onClick={addCharacter}
              className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {characters.length === 0 ? (
            <div className="text-center py-8 text-zinc-600">
              <User size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No characters yet</p>
              <button
                onClick={addCharacter}
                className="mt-2 text-red-500 hover:text-red-400 text-sm"
              >
                + Add your first character
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {characters.map((char) => {
                const archetype = getArchetype(char.archetype);
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedCharacter?.id === char.id
                        ? 'bg-red-600/20 border border-red-600/50'
                        : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {archetype && <archetype.icon size={16} className={archetype.color} />}
                      <span className="font-medium truncate">
                        {char.name || 'Unnamed Character'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 capitalize">
                      {char.archetype.replace('-', ' ')}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Relationship Map */}
          {characters.length > 1 && (
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-500 mb-3">RELATIONSHIPS</h4>
              <div className="space-y-2">
                {characters.map(char => (
                  char.relationships.map((rel, i) => {
                    const otherChar = characters.find(c => c.id === rel.characterId);
                    if (!otherChar) return null;
                    return (
                      <div key={`${char.id}-${i}`} className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="truncate">{char.name || 'Unnamed'}</span>
                        <ArrowRight size={10} />
                        <span className="text-zinc-500">{rel.type}</span>
                        <ArrowRight size={10} />
                        <span className="truncate">{otherChar.name || 'Unnamed'}</span>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Character Editor */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {selectedCharacter ? (
            <div className="max-w-3xl mx-auto">
              {/* Character Header */}
              <div className="flex items-start gap-4 mb-6">
                {/* Avatar */}
                <div className="w-24 h-24 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                  {selectedCharacter.imageUrl ? (
                    <img src={selectedCharacter.imageUrl} alt={selectedCharacter.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <User size={32} className="text-zinc-600" />
                  )}
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    value={selectedCharacter.name}
                    onChange={(e) => updateCharacter(selectedCharacter.id, { name: e.target.value })}
                    placeholder="Character Name"
                    className="w-full bg-transparent text-2xl font-bold border-none outline-none text-white placeholder-zinc-700 mb-2"
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedCharacter.archetype}
                      onChange={(e) => updateCharacter(selectedCharacter.id, { archetype: e.target.value })}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    >
                      {CHARACTER_ARCHETYPES.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={selectedCharacter.age}
                      onChange={(e) => updateCharacter(selectedCharacter.id, { age: e.target.value })}
                      placeholder="Age"
                      className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => deleteCharacter(selectedCharacter.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Character Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Description */}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Physical Description</label>
                  <textarea
                    value={selectedCharacter.description}
                    onChange={(e) => updateCharacter(selectedCharacter.id, { description: e.target.value })}
                    placeholder="Tall, scarred, wears a leather jacket..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm resize-none"
                    rows={2}
                  />
                </div>

                {/* Backstory */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">Backstory</label>
                    <button
                      onClick={() => handleAIGenerate('backstory')}
                      disabled={isGenerating}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Sparkles size={10} /> AI Generate
                    </button>
                  </div>
                  <textarea
                    value={selectedCharacter.backstory}
                    onChange={(e) => updateCharacter(selectedCharacter.id, { backstory: e.target.value })}
                    placeholder="Their history before the story begins..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm resize-none"
                    rows={3}
                  />
                </div>

                {/* Motivation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">Motivation</label>
                    <button
                      onClick={() => handleAIGenerate('motivation')}
                      disabled={isGenerating}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Sparkles size={10} /> AI
                    </button>
                  </div>
                  <textarea
                    value={selectedCharacter.motivation}
                    onChange={(e) => updateCharacter(selectedCharacter.id, { motivation: e.target.value })}
                    placeholder="What drives them..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm resize-none"
                    rows={2}
                  />
                </div>

                {/* Flaw */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">Fatal Flaw</label>
                    <button
                      onClick={() => handleAIGenerate('flaw')}
                      disabled={isGenerating}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Sparkles size={10} /> AI
                    </button>
                  </div>
                  <textarea
                    value={selectedCharacter.flaw}
                    onChange={(e) => updateCharacter(selectedCharacter.id, { flaw: e.target.value })}
                    placeholder="Their weakness..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm resize-none"
                    rows={2}
                  />
                </div>

                {/* Fighting Style */}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Fighting Style / Skills</label>
                  <input
                    type="text"
                    value={selectedCharacter.fightingStyle}
                    onChange={(e) => updateCharacter(selectedCharacter.id, { fightingStyle: e.target.value })}
                    placeholder="Muay Thai, gunslinger, tactical..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm"
                  />
                </div>

                {/* Skills Tags */}
                <div className="col-span-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Combat Skills</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCharacter.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-zinc-800 rounded text-xs flex items-center gap-1"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(selectedCharacter.id, i)}
                          className="text-zinc-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSkill(selectedCharacter.id)}
                      placeholder="Add skill (e.g., knife fighting, parkour)"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => addSkill(selectedCharacter.id)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Character Arc */}
              <div className="border border-zinc-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Character Arc</h3>
                  <button
                    onClick={() => handleAIGenerate('arc')}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs flex items-center gap-1"
                  >
                    <Sparkles size={12} /> AI Generate Arc
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">1</div>
                      <label className="text-xs text-zinc-500 uppercase">Beginning</label>
                    </div>
                    <textarea
                      value={selectedCharacter.arc.beginning}
                      onChange={(e) => updateCharacter(selectedCharacter.id, { arc: { ...selectedCharacter.arc, beginning: e.target.value } })}
                      placeholder="Who are they at the start?"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={4}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs font-bold">2</div>
                      <label className="text-xs text-zinc-500 uppercase">Midpoint</label>
                    </div>
                    <textarea
                      value={selectedCharacter.arc.midpoint}
                      onChange={(e) => updateCharacter(selectedCharacter.id, { arc: { ...selectedCharacter.arc, midpoint: e.target.value } })}
                      placeholder="How are they challenged?"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={4}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold">3</div>
                      <label className="text-xs text-zinc-500 uppercase">End</label>
                    </div>
                    <textarea
                      value={selectedCharacter.arc.end}
                      onChange={(e) => updateCharacter(selectedCharacter.id, { arc: { ...selectedCharacter.arc, end: e.target.value } })}
                      placeholder="Who do they become?"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Relationships */}
              <div className="border border-zinc-800 rounded-lg p-4">
                <h3 className="font-bold text-white mb-4">Relationships</h3>
                {characters.filter(c => c.id !== selectedCharacter.id).length === 0 ? (
                  <p className="text-sm text-zinc-500">Add more characters to define relationships</p>
                ) : (
                  <div className="space-y-3">
                    {characters.filter(c => c.id !== selectedCharacter.id).map(otherChar => {
                      const existingRel = selectedCharacter.relationships.find(r => r.characterId === otherChar.id);
                      return (
                        <div key={otherChar.id} className="flex items-center gap-3 bg-zinc-900 rounded-lg p-3">
                          <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                            <User size={14} className="text-zinc-500" />
                          </div>
                          <span className="font-medium text-sm">{otherChar.name || 'Unnamed'}</span>
                          <ArrowRight size={14} className="text-zinc-600" />
                          <select
                            value={existingRel?.type || ''}
                            onChange={(e) => {
                              const newRels = selectedCharacter.relationships.filter(r => r.characterId !== otherChar.id);
                              if (e.target.value) {
                                newRels.push({ characterId: otherChar.id, type: e.target.value, description: '' });
                              }
                              updateCharacter(selectedCharacter.id, { relationships: newRels });
                            }}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                          >
                            <option value="">No relationship</option>
                            <option value="ally">Ally</option>
                            <option value="enemy">Enemy</option>
                            <option value="mentor">Mentor</option>
                            <option value="student">Student</option>
                            <option value="love-interest">Love Interest</option>
                            <option value="rival">Rival</option>
                            <option value="family">Family</option>
                            <option value="partner">Partner</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-zinc-600">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No Character Selected</h3>
                <p className="text-sm mb-4">Select a character from the list or create a new one</p>
                <button
                  onClick={addCharacter}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium"
                >
                  <Plus size={16} className="inline mr-2" />
                  Create Character
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
