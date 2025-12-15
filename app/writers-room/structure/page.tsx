'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home, PenTool, MessageSquare, Film, Users, Sparkles,
  ChevronDown, ChevronRight, Plus, Trash2, GripVertical,
  Target, Zap, Trophy, BookOpen, Coins, Save, Upload,
  MessageCircle, Lightbulb, X, ArrowRight, Layout, FileText,
  Scroll, History, Lock, Unlock, HelpCircle, Clock
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

// Content type definitions
type ContentType = 'epic_scene' | 'short_sketch' | 'pilot' | 'festival' | 'blockbuster';

interface ContentTypeConfig {
  id: ContentType;
  name: string;
  duration: string;
  description: string;
  requiredBeats: string[]; // Beat IDs that are required
  optionalBeats: string[]; // Beat IDs that are optional (can be unlocked)
  hasTeaser: boolean;
}

const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    id: 'epic_scene',
    name: 'Epic Scene',
    duration: '1-3 min',
    description: 'Single powerful scene or moment',
    requiredBeats: ['1', '4', '8', '14', '15'],
    optionalBeats: [],
    hasTeaser: false,
  },
  {
    id: 'short_sketch',
    name: 'Short Sketch',
    duration: '< 15 min',
    description: 'Quick comedy or dramatic piece',
    requiredBeats: ['1', '3', '4', '8', '9', '14', '15'],
    optionalBeats: ['2', '5'],
    hasTeaser: false,
  },
  {
    id: 'pilot',
    name: 'Pilot / Series',
    duration: '> 30 min',
    description: 'TV pilot or series episode',
    requiredBeats: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '14', '15'],
    optionalBeats: ['12', '13'],
    hasTeaser: true,
  },
  {
    id: 'festival',
    name: 'Short Festival',
    duration: '< 60 min',
    description: 'Festival-length short film',
    requiredBeats: ['1', '2', '3', '4', '5', '6', '8', '9', '10', '11', '13', '14', '15'],
    optionalBeats: ['7', '12'],
    hasTeaser: false,
  },
  {
    id: 'blockbuster',
    name: 'Blockbuster',
    duration: '90-120 min',
    description: 'Full feature film',
    requiredBeats: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
    optionalBeats: [],
    hasTeaser: true,
  },
];

// Beat sheet structure based on Save the Cat / 3-act structure
interface PlotBeat {
  id: string;
  name: string;
  description: string;
  content: string;
  act: 1 | 2 | 3;
  percentageStart: number;
  isComplete: boolean;
  isLocked?: boolean; // For optional beats
}

interface Act {
  number: 1 | 2 | 3;
  name: string;
  description: string;
  beats: PlotBeat[];
  isExpanded: boolean;
}

const ALL_BEATS: PlotBeat[] = [
  // Teaser (for pilots/series)
  { id: 'teaser', name: 'Teaser / Cold Open', description: 'Hook the audience before the title - action or mystery that pulls them in', content: '', act: 1, percentageStart: 0, isComplete: false },

  // Act 1 - Setup (0-25%)
  { id: '1', name: 'Opening Image', description: 'Visual that sets the tone and shows the "before" snapshot', content: '', act: 1, percentageStart: 0, isComplete: false },
  { id: '2', name: 'Theme Stated', description: 'Someone states the theme/lesson the hero will learn', content: '', act: 1, percentageStart: 5, isComplete: false },
  { id: '3', name: 'Setup', description: 'Introduce the hero, their world, and what\'s missing', content: '', act: 1, percentageStart: 1, isComplete: false },
  { id: '4', name: 'Catalyst', description: 'The inciting incident that disrupts the hero\'s world', content: '', act: 1, percentageStart: 12, isComplete: false },
  { id: '5', name: 'Debate', description: 'Hero debates whether to take action', content: '', act: 1, percentageStart: 12, isComplete: false },

  // Act 2A - Fun and Games (25-50%)
  { id: '6', name: 'Break into Two', description: 'Hero makes a choice and enters a new world', content: '', act: 2, percentageStart: 25, isComplete: false },
  { id: '7', name: 'B Story', description: 'Secondary story (often love interest) that carries the theme', content: '', act: 2, percentageStart: 30, isComplete: false },
  { id: '8', name: 'Fun and Games', description: 'The promise of the premise - why we came to see this', content: '', act: 2, percentageStart: 30, isComplete: false },
  { id: '9', name: 'Midpoint', description: 'False victory or false defeat - stakes are raised', content: '', act: 2, percentageStart: 50, isComplete: false },

  // Act 2B - Bad Guys Close In (50-75%)
  { id: '10', name: 'Bad Guys Close In', description: 'External pressure mounts, internal doubts grow', content: '', act: 2, percentageStart: 55, isComplete: false },
  { id: '11', name: 'All Is Lost', description: 'The lowest point - death of the old way', content: '', act: 2, percentageStart: 75, isComplete: false },
  { id: '12', name: 'Dark Night of the Soul', description: 'Hero processes the loss and finds new strength', content: '', act: 2, percentageStart: 75, isComplete: false },

  // Act 3 - Resolution (75-100%)
  { id: '13', name: 'Break into Three', description: 'Hero has the solution thanks to characters in B Story', content: '', act: 3, percentageStart: 80, isComplete: false },
  { id: '14', name: 'Finale', description: 'Hero proves they\'ve changed, defeats the bad guys', content: '', act: 3, percentageStart: 85, isComplete: false },
  { id: '15', name: 'Final Image', description: 'Opposite of opening image - shows transformation', content: '', act: 3, percentageStart: 99, isComplete: false },
];

// Default to blockbuster (full beat sheet)
const DEFAULT_BEAT_SHEET: PlotBeat[] = ALL_BEATS.filter(b => b.id !== 'teaser');

const ACT_INFO = [
  { number: 1 as const, name: 'ACT I - SETUP', description: 'Establish the world, introduce the hero, present the problem', icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { number: 2 as const, name: 'ACT II - CONFRONTATION', description: 'Rising action, obstacles, the hero is tested', icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { number: 3 as const, name: 'ACT III - RESOLUTION', description: 'Climax, final battle, transformation complete', icon: Trophy, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
];

export default function StoryStructurePage() {
  const { user, credits } = useStore();
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [logline, setLogline] = useState('');
  const [genre, setGenre] = useState('Action');
  const [beats, setBeats] = useState<PlotBeat[]>(DEFAULT_BEAT_SHEET);
  const [expandedActs, setExpandedActs] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });
  const [selectedBeat, setSelectedBeat] = useState<PlotBeat | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [scriptContent, setScriptContent] = useState('');
  const [ideaPanel, setIdeaPanel] = useState<{ beatId: string; ideas: string } | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [loglinePanel, setLoglinePanel] = useState<{ ideas: string } | null>(null);
  const [loglineResponse, setLoglineResponse] = useState('');

  // Draft tracking
  const [currentDraft, setCurrentDraft] = useState<string>('');
  const [draftNumber, setDraftNumber] = useState(1);
  const [draftHistory, setDraftHistory] = useState<{ number: number; content: string; createdAt: string }[]>([]);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showDraftPanel, setShowDraftPanel] = useState(false);
  const [showDialogueMode, setShowDialogueMode] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('epic_scene');
  const [showGuide, setShowGuide] = useState(false);
  const [unlockedBeats, setUnlockedBeats] = useState<string[]>([]);

  // Get the current content type config
  const currentTypeConfig = CONTENT_TYPES.find(t => t.id === contentType) || CONTENT_TYPES[0];

  // Update beats when content type changes
  const handleContentTypeChange = (newType: ContentType) => {
    setContentType(newType);
    const config = CONTENT_TYPES.find(t => t.id === newType);
    if (!config) return;

    // Build new beat sheet based on content type
    const newBeats: PlotBeat[] = [];

    // Add teaser if this type supports it
    if (config.hasTeaser) {
      const teaserBeat = ALL_BEATS.find(b => b.id === 'teaser');
      if (teaserBeat) newBeats.push({ ...teaserBeat, isLocked: false });
    }

    // Add required and optional beats
    ALL_BEATS.filter(b => b.id !== 'teaser').forEach(beat => {
      if (config.requiredBeats.includes(beat.id)) {
        newBeats.push({ ...beat, isLocked: false });
      } else if (config.optionalBeats.includes(beat.id)) {
        newBeats.push({ ...beat, isLocked: !unlockedBeats.includes(beat.id) });
      }
    });

    setBeats(newBeats);
  };

  const toggleBeatLock = (beatId: string) => {
    if (unlockedBeats.includes(beatId)) {
      setUnlockedBeats(prev => prev.filter(id => id !== beatId));
      setBeats(prev => prev.map(b => b.id === beatId ? { ...b, isLocked: true } : b));
    } else {
      setUnlockedBeats(prev => [...prev, beatId]);
      setBeats(prev => prev.map(b => b.id === beatId ? { ...b, isLocked: false } : b));
    }
  };

  const toggleAct = (actNum: number) => {
    setExpandedActs(prev => ({ ...prev, [actNum]: !prev[actNum] }));
  };

  const updateBeat = (beatId: string, content: string) => {
    setBeats(prev => prev.map(b =>
      b.id === beatId ? { ...b, content, isComplete: content.trim().length > 0 } : b
    ));
  };

  const getActBeats = (actNum: number) => beats.filter(b => b.act === actNum);

  const getActProgress = (actNum: number) => {
    const actBeats = getActBeats(actNum);
    const completed = actBeats.filter(b => b.isComplete).length;
    return Math.round((completed / actBeats.length) * 100);
  };

  const getTotalProgress = () => {
    const completed = beats.filter(b => b.isComplete).length;
    return Math.round((completed / beats.length) * 100);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/writers-room/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to parse PDF');

      const data = await response.json();
      setScriptContent(data.text);
      setProjectTitle(file.name.replace('.pdf', ''));
    } catch (error) {
      console.error('PDF upload error:', error);
      alert('Failed to load PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleAISuggest = async (beat: PlotBeat) => {
    if (!logline.trim() && !scriptContent.trim()) {
      alert('Please add a logline or upload your script first!');
      return;
    }

    setIsGenerating(true);
    setIdeaPanel({ beatId: beat.id, ideas: '' });

    try {
      const contextInfo = scriptContent
        ? `EXISTING SCRIPT:\n${scriptContent.slice(0, 2000)}...\n\n`
        : '';

      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: `${contextInfo}LOGLINE: ${logline}\nGENRE: ${genre}\n\nBEAT: ${beat.name}\nDESCRIPTION: ${beat.description}\n\nCurrent content: ${beat.content || '(empty - needs ideas)'}\n\nPrevious beats:\n${beats.filter(b => b.act < beat.act || (b.act === beat.act && parseInt(b.id) < parseInt(beat.id))).map(b => `${b.name}: ${b.content}`).join('\n')}`,
          action: 'beat',
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to get ideas');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let ideas = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ideas += decoder.decode(value);
          setIdeaPanel({ beatId: beat.id, ideas });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to brainstorm ideas');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRiff = async (beatId: string) => {
    if (!userResponse.trim()) return;

    const beat = beats.find(b => b.id === beatId);
    if (!beat) return;

    setIsGenerating(true);
    try {
      // Include the conversation so far for context
      const conversationContext = ideaPanel?.ideas
        ? `PREVIOUS CONVERSATION:\n${ideaPanel.ideas}\n\n---\n\nNOW THE WRITER RESPONDS:`
        : '';

      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: `${conversationContext}\nContext: Working on "${beat.name}" beat for a ${genre} film.\nLogline: ${logline}\n\nWriter says: "${userResponse}"`,
          action: 'riff',
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to riff');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let riff = ideaPanel?.ideas ? ideaPanel.ideas + '\n\n---\n\n' : '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          riff += decoder.decode(value);
          setIdeaPanel({ beatId, ideas: riff });
        }
      }
      setUserResponse('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyIdea = (beatId: string, idea: string) => {
    updateBeat(beatId, idea);
    setIdeaPanel(null);
  };

  const handleLoglineBrainstorm = async () => {
    if (!logline.trim() && !scriptContent.trim()) {
      alert('Add a rough logline idea or upload your script first!');
      return;
    }

    setIsGenerating(true);
    setLoglinePanel({ ideas: '' });

    try {
      const context = scriptContent
        ? `SCRIPT EXCERPT:\n${scriptContent.slice(0, 1500)}\n\nCURRENT LOGLINE ATTEMPT: ${logline || '(none yet)'}`
        : `GENRE: ${genre}\nLOGLINE: ${logline}`;

      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: context,
          action: 'logline',
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to brainstorm');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let ideas = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ideas += decoder.decode(value);
          setLoglinePanel({ ideas });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to brainstorm logline');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoglineRiff = async () => {
    if (!loglineResponse.trim()) return;

    setIsGenerating(true);
    try {
      // Include the conversation so far for context
      const conversationContext = loglinePanel?.ideas
        ? `PREVIOUS CONVERSATION:\n${loglinePanel.ideas}\n\n---\n\nNOW THE WRITER RESPONDS:`
        : '';

      const response = await fetch('/api/writers-room/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: `${conversationContext}\nWorking on logline for ${genre} film.\nCurrent: "${logline}"\n\nWriter says: "${loglineResponse}"`,
          action: 'riff',
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to riff');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let riff = loglinePanel?.ideas ? loglinePanel.ideas + '\n\n---\n\n' : '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          riff += decoder.decode(value);
          setLoglinePanel({ ideas: riff });
        }
      }
      setLoglineResponse('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDraft = async () => {
    const completedBeats = beats.filter(b => b.content && b.content.trim().length > 0);
    console.log('Completed beats:', completedBeats.length, completedBeats.map(b => b.name));

    if (completedBeats.length < 3) {
      alert(`Please complete at least 3 beats before generating a draft! (You have ${completedBeats.length})`);
      return;
    }

    if (!logline.trim()) {
      alert('Please add a logline first!');
      return;
    }

    setIsGeneratingDraft(true);
    setShowDraftPanel(true);
    setCurrentDraft('');

    try {
      const response = await fetch('/api/writers-room/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logline,
          genre,
          beats,
          draftNumber,
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate draft');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let draft = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          draft += decoder.decode(value);
          setCurrentDraft(draft);
        }
      }

      // Save to history
      const newDraft = {
        number: draftNumber,
        content: draft,
        createdAt: new Date().toISOString(),
      };
      setDraftHistory(prev => [...prev, newDraft]);
      setDraftNumber(prev => prev + 1);

      // Save to localStorage
      const projectData = {
        title: projectTitle,
        logline,
        genre,
        beats,
        currentDraft: draft,
        draftNumber: draftNumber + 1,
        draftHistory: [...draftHistory, newDraft],
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('writers-room-structure', JSON.stringify(projectData));

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate draft');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      alert('Please sign in to save');
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage for now, can integrate with Supabase later
      const projectData = {
        title: projectTitle,
        logline,
        genre,
        contentType,
        beats,
        currentDraft,
        draftNumber,
        draftHistory,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('writers-room-structure', JSON.stringify(projectData));
      alert('Structure saved!');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize beats for default content type on mount
  useEffect(() => {
    const saved = localStorage.getItem('writers-room-structure');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setProjectTitle(data.title || 'Untitled Project');
        setLogline(data.logline || '');
        setGenre(data.genre || 'Action');
        if (data.contentType) setContentType(data.contentType);
        if (data.beats) setBeats(data.beats);
        if (data.currentDraft) setCurrentDraft(data.currentDraft);
        if (data.draftNumber) setDraftNumber(data.draftNumber);
        if (data.draftHistory) setDraftHistory(data.draftHistory);
      } catch (e) {
        console.error('Failed to load saved structure:', e);
      }
    } else {
      // Initialize with default content type (epic_scene)
      handleContentTypeChange('epic_scene');
    }
  }, []);

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
            <div className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium flex items-center gap-2">
              <BookOpen size={14} />
              Structure
            </div>
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
            <Link
              href="/writers-room/storyboard"
              className="px-4 py-1.5 text-zinc-400 hover:text-white rounded text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Layout size={14} />
              Storyboard
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
            <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {isUploadingPdf ? 'Loading...' : 'Load Script'}
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                disabled={isUploadingPdf}
              />
            </label>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Scroll size={16} />
              {isGeneratingDraft ? 'Writing...' : `Generate Draft #${draftNumber}`}
            </button>
          </div>
        </div>

        {/* Draft Number Badge */}
        {draftHistory.length > 0 && (
          <div className="px-6 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <History size={14} className="text-zinc-500" />
                <span className="text-zinc-400">Draft History:</span>
                {draftHistory.map((d) => (
                  <button
                    key={d.number}
                    onClick={() => {
                      setCurrentDraft(d.content);
                      setShowDraftPanel(true);
                    }}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      d.number === draftNumber - 1
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    #{d.number}
                  </button>
                ))}
              </div>
            </div>
            {currentDraft && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDraftPanel(!showDraftPanel)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-medium flex items-center gap-1"
                >
                  <FileText size={12} />
                  {showDraftPanel ? 'Hide Draft' : 'View Draft'}
                </button>
                <button
                  onClick={() => setShowDialogueMode(!showDialogueMode)}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    showDialogueMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                >
                  <MessageSquare size={12} />
                  Dialogue Mode
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex">
        {/* Left: Project Info & Beat Sheet */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {/* Project Header */}
          <div className="mb-8">
            {/* Content Type Selector - What are you writing? */}
            <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white">What are you writing?</label>
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"
                >
                  <HelpCircle size={12} />
                  Scriptwriting Guide
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleContentTypeChange(type.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      contentType === type.id
                        ? 'bg-red-600/20 border-red-500/50 text-white'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Clock size={12} />
                      <span className="text-xs">{type.duration}</span>
                    </div>
                    <div className="font-medium text-sm">{type.name}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {currentTypeConfig.description} - {currentTypeConfig.requiredBeats.length} required beats
                {currentTypeConfig.optionalBeats.length > 0 && `, ${currentTypeConfig.optionalBeats.length} optional`}
                {currentTypeConfig.hasTeaser && ' + teaser'}
              </p>
            </div>

            {/* Scriptwriting Guide Embed */}
            {showGuide && (
              <div className="mb-6 rounded-lg overflow-hidden border border-zinc-800">
                <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Scriptwriting Guide</span>
                  <button onClick={() => setShowGuide(false)} className="text-zinc-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <iframe
                  src="https://gamma.app/embed/totsu27eket1ldq"
                  style={{ width: '100%', height: '450px' }}
                  allow="fullscreen"
                  title="Mastering Scriptwriting: Key Concepts & Pro Tips"
                />
              </div>
            )}

            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-transparent text-3xl font-bold mb-4 border-none outline-none text-white placeholder-zinc-700"
              placeholder="PROJECT TITLE"
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option>Action</option>
                  <option>Action Comedy</option>
                  <option>Martial Arts</option>
                  <option>Thriller</option>
                  <option>Sci-Fi Action</option>
                  <option>Crime Drama</option>
                  <option>War</option>
                  <option>Western</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">Progress</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                      style={{ width: `${getTotalProgress()}%` }}
                    />
                  </div>
                  <span className="text-sm text-zinc-400">{getTotalProgress()}%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-500 uppercase tracking-wide">Logline</label>
                <button
                  onClick={handleLoglineBrainstorm}
                  disabled={isGenerating}
                  className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 disabled:opacity-50 rounded text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Lightbulb size={10} />
                  {isGenerating && loglinePanel ? 'Thinking...' : 'Brainstorm'}
                </button>
              </div>
              <textarea
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                placeholder="A retired assassin is forced back into action when..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm resize-none"
                rows={2}
              />

              {/* Logline Brainstorm Panel */}
              {loglinePanel && (
                <div className="mt-3 p-4 bg-purple-950/30 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-purple-300 text-xs font-medium">
                      <MessageCircle size={14} />
                      Logline Workshop
                    </div>
                    <button
                      onClick={() => setLoglinePanel(null)}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="text-sm text-zinc-300 whitespace-pre-wrap mb-4">
                    {loglinePanel.ideas || 'Brainstorming...'}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={loglineResponse}
                      onChange={(e) => setLoglineResponse(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoglineRiff()}
                      placeholder="Tell me more about your vision..."
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-zinc-500"
                    />
                    <button
                      onClick={handleLoglineRiff}
                      disabled={isGenerating || !loglineResponse.trim()}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-sm font-medium flex items-center gap-1"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {scriptContent && (
              <div className="mt-4 p-3 bg-green-950/30 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <BookOpen size={16} />
                    Script loaded ({Math.round(scriptContent.length / 1000)}k chars)
                  </div>
                  <button
                    onClick={() => setScriptContent('')}
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Beat Sheet */}
          <div className="space-y-4">
            {ACT_INFO.map((act) => (
              <div key={act.number} className={`border ${act.borderColor} rounded-lg overflow-hidden`}>
                {/* Act Header */}
                <button
                  onClick={() => toggleAct(act.number)}
                  className={`w-full px-4 py-3 ${act.bgColor} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <act.icon size={20} className={act.color} />
                    <div className="text-left">
                      <div className={`font-bold ${act.color}`}>{act.name}</div>
                      <div className="text-xs text-zinc-400">{act.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${act.color.replace('text-', 'bg-')} transition-all`}
                          style={{ width: `${getActProgress(act.number)}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{getActProgress(act.number)}%</span>
                    </div>
                    {expandedActs[act.number] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </button>

                {/* Beats */}
                {expandedActs[act.number] && (
                  <div className="divide-y divide-zinc-800">
                    {getActBeats(act.number).map((beat) => {
                      const isOptional = currentTypeConfig.optionalBeats.includes(beat.id);
                      const isLocked = beat.isLocked;

                      return (
                        <div
                          key={beat.id}
                          className={`p-4 ${isLocked ? 'opacity-50' : ''} ${selectedBeat?.id === beat.id ? 'bg-zinc-800/50' : 'bg-zinc-950'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isLocked ? 'bg-zinc-700 text-zinc-500' :
                              beat.isComplete ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {isLocked ? <Lock size={12} /> : beat.isComplete ? '✓' : beat.id === 'teaser' ? 'T' : beat.id}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-semibold ${isLocked ? 'text-zinc-500' : 'text-white'}`}>{beat.name}</h4>
                                  {isOptional && (
                                    <button
                                      onClick={() => toggleBeatLock(beat.id)}
                                      className="text-xs text-zinc-500 hover:text-white flex items-center gap-1"
                                    >
                                      {isLocked ? <><Unlock size={10} /> Unlock</> : <><Lock size={10} /> Lock</>}
                                    </button>
                                  )}
                                  {beat.id === 'teaser' && (
                                    <span className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded">Teaser</span>
                                  )}
                                </div>
                                <span className="text-xs text-zinc-600">{beat.percentageStart}%</span>
                              </div>
                              <p className="text-xs text-zinc-500 mb-2">{beat.description}</p>

                              {isLocked ? (
                                <div className="text-xs text-zinc-600 italic py-2">
                                  Optional beat - click Unlock to add to your structure
                                </div>
                              ) : (
                                <>
                                  <textarea
                                    value={beat.content}
                                    onChange={(e) => updateBeat(beat.id, e.target.value)}
                                    placeholder="Describe what happens in this beat..."
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white resize-none focus:border-zinc-700 focus:outline-none"
                                    rows={3}
                                  />
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => handleAISuggest(beat)}
                                      disabled={isGenerating}
                                      className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 disabled:opacity-50 rounded text-xs font-medium transition-colors flex items-center gap-1"
                                    >
                                      <Lightbulb size={12} />
                                      {isGenerating && ideaPanel?.beatId === beat.id ? 'Thinking...' : 'Brainstorm'}
                                    </button>
                                  </div>
                                </>
                              )}

                            {/* Collaborative Idea Panel */}
                            {ideaPanel?.beatId === beat.id && (
                              <div className="mt-3 p-4 bg-purple-950/30 border border-purple-500/20 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2 text-purple-300 text-xs font-medium">
                                    <MessageCircle size={14} />
                                    Writing Partner
                                  </div>
                                  <button
                                    onClick={() => setIdeaPanel(null)}
                                    className="text-zinc-500 hover:text-white"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>

                                <div className="text-sm text-zinc-300 whitespace-pre-wrap mb-4">
                                  {ideaPanel.ideas || 'Brainstorming...'}
                                </div>

                                {/* Response input for back-and-forth */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={userResponse}
                                    onChange={(e) => setUserResponse(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRiff(beat.id)}
                                    placeholder="Riff on an idea or share your thoughts..."
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-zinc-500"
                                  />
                                  <button
                                    onClick={() => handleRiff(beat.id)}
                                    disabled={isGenerating || !userResponse.trim()}
                                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-sm font-medium flex items-center gap-1"
                                  >
                                    <ArrowRight size={14} />
                                  </button>
                                </div>

                                <div className="mt-3 pt-3 border-t border-purple-500/20">
                                  <button
                                    onClick={() => {
                                      const content = beat.content + (beat.content ? '\n\n' : '') + 'Notes from brainstorm:\n' + ideaPanel.ideas;
                                      updateBeat(beat.id, content);
                                      setIdeaPanel(null);
                                    }}
                                    className="text-xs text-purple-400 hover:text-purple-300"
                                  >
                                    Add notes to beat
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visual Timeline */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-wide mb-4">Story Timeline</h3>

          {/* Visual Arc */}
          <div className="relative h-40 mb-6">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Story arc curve */}
              <path
                d="M 10 90 Q 50 80, 70 60 Q 90 40, 100 30 Q 110 20, 120 25 Q 140 35, 160 50 Q 180 65, 190 85"
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Act markers */}
              <circle cx="10" cy="90" r="4" fill="#3b82f6" />
              <circle cx="70" cy="60" r="4" fill="#3b82f6" />
              <circle cx="100" cy="30" r="4" fill="#eab308" />
              <circle cx="140" cy="35" r="4" fill="#eab308" />
              <circle cx="190" cy="85" r="4" fill="#ef4444" />

              {/* Labels */}
              <text x="10" y="98" fontSize="6" fill="#71717a" textAnchor="middle">Setup</text>
              <text x="70" y="55" fontSize="6" fill="#71717a" textAnchor="middle">Catalyst</text>
              <text x="100" y="25" fontSize="6" fill="#71717a" textAnchor="middle">Midpoint</text>
              <text x="140" y="30" fontSize="6" fill="#71717a" textAnchor="middle">All Is Lost</text>
              <text x="190" y="98" fontSize="6" fill="#71717a" textAnchor="middle">Resolution</text>
            </svg>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3">
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1">Beats Completed</div>
              <div className="text-2xl font-bold text-white">
                {beats.filter(b => b.isComplete).length} / {beats.length}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ACT_INFO.map((act) => (
                <div key={act.number} className={`${act.bgColor} rounded-lg p-2 text-center`}>
                  <div className={`text-lg font-bold ${act.color}`}>{getActProgress(act.number)}%</div>
                  <div className="text-xs text-zinc-500">Act {act.number}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <h4 className="text-xs font-bold text-zinc-400 mb-2">Action Film Tips</h4>
            <ul className="text-xs text-zinc-500 space-y-1">
              <li>Start with a bang - hook in 5 pages</li>
              <li>Action every 10-15 pages</li>
              <li>Midpoint should escalate stakes</li>
              <li>Climax = biggest, best action</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Draft Panel - Slides up from bottom */}
      {showDraftPanel && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white">
                Draft #{draftHistory.length > 0 ? draftHistory[draftHistory.length - 1]?.number : draftNumber}
              </h2>
              {isGeneratingDraft && (
                <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded animate-pulse">
                  Writing...
                </span>
              )}
              {showDialogueMode && (
                <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                  Dialogue Focus Mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDialogueMode(!showDialogueMode)}
                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 ${
                  showDialogueMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                <MessageSquare size={14} />
                {showDialogueMode ? 'Exit Dialogue Mode' : 'Dialogue Mode'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentDraft);
                  alert('Draft copied to clipboard!');
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-medium"
              >
                Copy
              </button>
              <button
                onClick={() => setShowDraftPanel(false)}
                className="p-2 hover:bg-zinc-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {showDialogueMode ? (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded-lg mb-6">
                    <h3 className="text-purple-300 font-medium mb-2">Dialogue Focus Mode</h3>
                    <p className="text-sm text-zinc-400">
                      Look for [DIALOGUE NEEDED] markers below. Click on any dialogue line to brainstorm alternatives.
                    </p>
                  </div>
                  <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {currentDraft.split('\n').map((line, i) => {
                      const isDialogueNeeded = line.includes('[DIALOGUE NEEDED]');
                      const isCharacterLine = /^[A-Z]{2,}(\s*\(.*\))?$/.test(line.trim());
                      const isDialogue = !line.startsWith('INT.') && !line.startsWith('EXT.') &&
                                        !isCharacterLine && line.trim() &&
                                        !line.includes('FADE') && !line.includes('CUT TO');

                      return (
                        <span
                          key={i}
                          className={`block ${
                            isDialogueNeeded
                              ? 'bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded cursor-pointer hover:bg-yellow-500/30'
                              : isCharacterLine
                              ? 'text-purple-400 font-bold mt-4'
                              : ''
                          }`}
                        >
                          {line}
                        </span>
                      );
                    })}
                  </pre>
                </div>
              ) : (
                <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {currentDraft || 'Generating draft...'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
