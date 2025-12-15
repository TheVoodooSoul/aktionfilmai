'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Plus, Play, FileText, Video, Square, Upload, Sparkles, Volume2, Wand2, Home, PenTool, MessageSquare, Film, Coins, BookOpen, Users } from 'lucide-react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'character';
  content: string;
  timestamp: Date;
  selected?: boolean;
}

interface Character {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  avatar_id?: string;
}

export default function ImprovPage() {
  const { user } = useStore();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRunningLines, setIsRunningLines] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mode: 'chat' or 'scene-recording'
  const [mode, setMode] = useState<'chat' | 'scene-recording'>('chat');

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isGeneratingPerformance, setIsGeneratingPerformance] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Scene recording state
  const [sceneClips, setSceneClips] = useState<Array<{ role: 'user' | 'character'; videoUrl: string; text: string }>>([]);
  const [waitingForAI, setWaitingForAI] = useState(false);

  // Character generation state
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [generatedCharacterImage, setGeneratedCharacterImage] = useState<string | null>(null);
  const [characterDescription, setCharacterDescription] = useState('');
  const [showCharacterGenerator, setShowCharacterGenerator] = useState(false);

  // Voice testing state
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('male-deep');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, [user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCharacters = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('character_references')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setCharacters(data);
    }
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setGeneratedCharacterImage(null); // Clear any generated image
    setMessages([
      {
        id: '0',
        role: 'character',
        content: `Hey, I'm ${character.name}. Let's improvise a scene together. What do you want to explore?`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleGenerateCharacter = async () => {
    if (!characterDescription.trim()) {
      alert('Please enter a character description');
      return;
    }

    setIsGeneratingCharacter(true);
    try {
      const response = await fetch('/api/writers-room/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: selectedCharacter?.name || 'AI Character',
          characterDescription: characterDescription,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedCharacterImage(data.imageUrl);
        alert('✅ Character image generated!');
      } else {
        alert('Failed to generate character image');
      }
    } catch (error) {
      console.error('Generate character error:', error);
      alert('Failed to generate character image');
    } finally {
      setIsGeneratingCharacter(false);
      setShowCharacterGenerator(false);
      setCharacterDescription('');
    }
  };

  const handleTestVoice = async (text: string, messageId: string) => {
    setTestingVoice(messageId);
    try {
      const response = await fetch('/api/writers-room/test-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          characterName: selectedCharacter?.name,
        }),
      });

      const data = await response.json();
      if (data.audioUrl) {
        // Play audio
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        await audio.play();
      } else {
        alert(data.message || 'Voice testing not available');
      }
    } catch (error) {
      console.error('Test voice error:', error);
      alert('Failed to test voice');
    } finally {
      setTestingVoice(null);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedCharacter) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call AI improv API
      const response = await fetch('/api/writers-room/improv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: selectedCharacter.name,
          characterDescription: selectedCharacter.description || `Action hero named ${selectedCharacter.name}`,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
          userMessage: input.trim(),
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.reply) {
        const characterMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'character',
          content: data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, characterMessage]);
      }
    } catch (error) {
      console.error('Improv error:', error);
      alert('Failed to get character response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const toggleSelectMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, selected: !msg.selected } : msg
      )
    );
  };

  const handleInsertToScript = () => {
    const selectedMessages = messages.filter((msg) => msg.selected);
    if (selectedMessages.length === 0) {
      alert('Please select some messages to insert into your script.');
      return;
    }

    // Format as script dialogue
    const scriptLines = selectedMessages
      .map((msg) => {
        const speaker = msg.role === 'user' ? 'YOU' : selectedCharacter?.name.toUpperCase();
        return `${speaker}\n${msg.content}\n`;
      })
      .join('\n');

    // Copy to clipboard
    navigator.clipboard.writeText(scriptLines);
    alert('✅ Selected dialogue copied to clipboard! Paste it into your script.');
  };

  const handleRunLines = async () => {
    const selectedMessages = messages.filter((msg) => msg.selected && msg.role === 'character');
    if (selectedMessages.length === 0) {
      alert('Please select some character lines to perform.');
      return;
    }

    if (!selectedCharacter?.avatar_id) {
      alert('This character needs an avatar to run lines. Please train an avatar first.');
      return;
    }

    setIsRunningLines(true);

    try {
      // Combine selected lines
      const dialogue = selectedMessages.map((msg) => msg.content).join(' ');

      // Call A2E talking video API
      const response = await fetch('/api/a2e/talking-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: selectedCharacter.avatar_id,
          text: dialogue,
          name: `${selectedCharacter.name} - Improv Lines`,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.output_url) {
        // Open video in new tab
        window.open(data.output_url, '_blank');
        alert('✅ Lines performed! Video opened in new tab.');
      } else {
        alert('Failed to generate performance video.');
      }
    } catch (error) {
      console.error('Run lines error:', error);
      alert('Failed to run lines. Please try again.');
    } finally {
      setIsRunningLines(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(blob);
        setRecordedVideoUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Failed to start recording. Please allow camera and microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGeneratePerformance = async () => {
    if (!recordedVideo || !selectedCharacter?.avatar_id) {
      alert('Please record a video and ensure your character has an avatar.');
      return;
    }

    setIsGeneratingPerformance(true);

    try {
      // Upload video to Supabase storage
      const fileName = `${user?.id}/${Date.now()}-performance.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('character-uploads')
        .upload(fileName, recordedVideo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(fileName);

      // Call API to generate avatar performance with user's audio
      const response = await fetch('/api/writers-room/generate-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: publicUrl,
          avatarId: selectedCharacter.avatar_id,
          characterName: selectedCharacter.name,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.output_url) {
        window.open(data.output_url, '_blank');
        alert('✅ Avatar performance generated! Video opened in new tab.');

        // Clear recorded video
        setRecordedVideo(null);
        setRecordedVideoUrl(null);
      } else {
        alert('Failed to generate avatar performance.');
      }
    } catch (error) {
      console.error('Generate performance error:', error);
      alert('Failed to generate avatar performance. Please try again.');
    } finally {
      setIsGeneratingPerformance(false);
    }
  };

  const handleSceneRecordingTurn = async () => {
    if (!recordedVideo || !selectedCharacter) {
      return;
    }

    setWaitingForAI(true);

    try {
      // Upload user's video
      const userFileName = `${user?.id}/${Date.now()}-scene-user.webm`;
      const { data: userUpload, error: userUploadError } = await supabase.storage
        .from('character-uploads')
        .upload(userFileName, recordedVideo);

      if (userUploadError) throw userUploadError;

      const { data: { publicUrl: userVideoUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(userFileName);

      // Add user clip to scene
      setSceneClips(prev => [...prev, {
        role: 'user',
        videoUrl: userVideoUrl,
        text: 'User performance',
      }]);

      // Generate AI response text
      const improvResponse = await fetch('/api/writers-room/improv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: selectedCharacter.name,
          characterDescription: selectedCharacter.description || `Action hero named ${selectedCharacter.name}`,
          conversationHistory: sceneClips.map(clip => ({
            role: clip.role,
            content: clip.text,
          })),
          userMessage: 'Continue the scene naturally',
          userId: user?.id,
        }),
      });

      const improvData = await improvResponse.json();

      if (!improvData.reply || !selectedCharacter.avatar_id) {
        throw new Error('Failed to generate AI response');
      }

      // Generate voice with OpenAI TTS
      const ttsResponse = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: improvData.reply,
          voice: 'onyx', // Default voice, can be customized per character
          model: 'tts-1',
        }),
      });

      if (!ttsResponse.ok) {
        throw new Error('Failed to generate voice');
      }

      const audioBlob = await ttsResponse.blob();

      // Upload audio to Supabase
      const audioFileName = `${user?.id}/${Date.now()}-character-voice.mp3`;
      const { data: audioUpload, error: audioUploadError } = await supabase.storage
        .from('character-uploads')
        .upload(audioFileName, audioBlob);

      if (audioUploadError) throw audioUploadError;

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(audioFileName);

      // Generate AI avatar performance with voice
      const performanceResponse = await fetch('/api/a2e/talking-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: selectedCharacter.avatar_id,
          audioUrl: audioUrl,
          name: `${selectedCharacter.name} - Scene Turn`,
          userId: user?.id,
        }),
      });

      const performanceData = await performanceResponse.json();

      if (performanceData.output_url) {
        // Add AI clip to scene
        setSceneClips(prev => [...prev, {
          role: 'character',
          videoUrl: performanceData.output_url,
          text: improvData.reply,
        }]);

        alert('✅ AI performed! Ready for your next line.');
      }

      // Clear recorded video for next turn
      setRecordedVideo(null);
      setRecordedVideoUrl(null);

    } catch (error) {
      console.error('Scene recording turn error:', error);
      alert('Failed to process scene turn. Please try again.');
    } finally {
      setWaitingForAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
            <div className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium flex items-center gap-2">
              <MessageSquare size={14} />
              Improv
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {selectedCharacter && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                <button
                  onClick={() => setMode('chat')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    mode === 'chat' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setMode('scene-recording')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    mode === 'scene-recording' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Scene Recording
                </button>
              </div>
            )}
            <button
              onClick={handleInsertToScript}
              disabled={!messages.some((m) => m.selected)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FileText size={16} />
              Insert to Script
            </button>
            <button
              onClick={handleRunLines}
              disabled={!messages.some((m) => m.selected && m.role === 'character') || isRunningLines || !selectedCharacter?.avatar_id}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-900 disabled:text-zinc-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Play size={16} />
              {isRunningLines ? 'Performing...' : 'Run Lines'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Character Selection Sidebar */}
        {!selectedCharacter && (
          <div className="w-full max-w-4xl mx-auto p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Select a Character</h2>
              <p className="text-zinc-400 text-sm">
                Choose a character to improvise with. They'll stay in character and respond naturally.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => handleSelectCharacter(character)}
                  className="group relative aspect-[2/3] bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-red-600 transition-all"
                >
                  {character.image_url && (
                    <Image
                      src={character.image_url}
                      alt={character.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg">{character.name}</h3>
                      {character.avatar_id && (
                        <span className="text-xs text-green-400 flex items-center gap-1 mt-1">
                          <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                          Avatar Ready
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {characters.length === 0 && (
                <div className="col-span-full text-center py-12 text-zinc-600">
                  <p className="mb-4">No characters yet. Create one in the Canvas first!</p>
                  <Link href="/canvas" className="text-red-500 hover:text-red-400 font-medium">
                    Go to Canvas →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Improv Session */}
        {selectedCharacter && (
          <div className="flex-1 flex">
            {/* Character Avatar Panel */}
            <div className="w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col">
              <div className="aspect-[3/4] relative bg-black">
                {(generatedCharacterImage || selectedCharacter.image_url) && (
                  <>
                    <Image
                      src={generatedCharacterImage || selectedCharacter.image_url || ''}
                      alt={selectedCharacter.name}
                      fill
                      className="object-cover"
                    />
                    {/* Film grain overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  </>
                )}
                {/* Generate Character Button */}
                <button
                  onClick={() => setShowCharacterGenerator(true)}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Wand2 size={14} />
                  Generate Look
                </button>
              </div>
              <div className="p-6 space-y-3">
                <h2 className="text-xl font-bold">{selectedCharacter.name}</h2>
                {selectedCharacter.description && (
                  <p className="text-sm text-zinc-400">{selectedCharacter.description}</p>
                )}
                <div className="pt-2 border-t border-zinc-800">
                  {selectedCharacter.avatar_id ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      Avatar Ready - Can perform lines
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                      No avatar - Train one to perform lines
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Change Character
                </button>

                {/* Character Generator Modal */}
                {showCharacterGenerator && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 p-6 rounded-xl max-w-md w-full">
                      <h3 className="text-lg font-bold mb-4">Generate Character Appearance</h3>
                      <textarea
                        value={characterDescription}
                        onChange={(e) => setCharacterDescription(e.target.value)}
                        placeholder="Describe the character's appearance: scarred face, military uniform, intense eyes..."
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleGenerateCharacter}
                          disabled={isGeneratingCharacter}
                          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          {isGeneratingCharacter ? (
                            <>
                              <Sparkles size={16} className="animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              Generate (5 credits)
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowCharacterGenerator(false);
                            setCharacterDescription('');
                          }}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Testing Controls */}
                <div className="pt-4 border-t border-zinc-800">
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Volume2 size={16} className="text-blue-500" />
                    Voice Testing
                  </h3>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male-deep">Male - Deep</option>
                    <option value="male-neutral">Male - Neutral</option>
                    <option value="female-warm">Female - Warm</option>
                    <option value="female-energetic">Female - Energetic</option>
                    <option value="narrator">Narrator</option>
                    <option value="mysterious">Mysterious</option>
                  </select>
                  <p className="text-xs text-zinc-500 mt-2">
                    Click the speaker icon on any message to hear it spoken
                  </p>
                </div>

                {/* Performance Recording Section */}
                <div className="pt-4 border-t border-zinc-800">
                  <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <Video size={16} className="text-red-500" />
                    Performance Recording
                  </h3>
                  <p className="text-xs text-zinc-500 mb-3">
                    Record yourself saying lines, then watch your character perform them with your voice.
                  </p>

                  {/* Video preview */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3 border border-zinc-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      src={recordedVideoUrl || undefined}
                    />
                  </div>

                  {/* Recording controls */}
                  <div className="space-y-2">
                    {!isRecording && !recordedVideo && (
                      <button
                        onClick={startRecording}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Video size={16} />
                        Start Recording
                      </button>
                    )}

                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 animate-pulse"
                      >
                        <Square size={16} className="text-red-500" />
                        Stop Recording
                      </button>
                    )}

                    {recordedVideo && !isRecording && (
                      <div className="space-y-2">
                        <button
                          onClick={mode === 'scene-recording' ? handleSceneRecordingTurn : handleGeneratePerformance}
                          disabled={(isGeneratingPerformance || waitingForAI) || !selectedCharacter?.avatar_id}
                          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Play size={16} />
                          {(isGeneratingPerformance || waitingForAI) ? 'AI Performing...' :
                           mode === 'scene-recording' ? 'Submit & AI Responds' : 'Generate Avatar Performance'}
                        </button>
                        <button
                          onClick={() => {
                            setRecordedVideo(null);
                            setRecordedVideoUrl(null);
                          }}
                          className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          Record Again
                        </button>
                      </div>
                    )}

                    {recordedVideo && !selectedCharacter?.avatar_id && (
                      <p className="text-xs text-yellow-400">
                        Train an avatar first to generate performance
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface / Scene Clips */}
            <div className="flex-1 flex flex-col">
              {mode === 'scene-recording' && sceneClips.length > 0 && (
                <div className="p-4 bg-zinc-900 border-b border-zinc-800">
                  <h3 className="text-sm font-bold mb-2">Scene Progress ({sceneClips.length} clips)</h3>
                  <div className="flex gap-2 overflow-x-auto">
                    {sceneClips.map((clip, index) => (
                      <div key={index} className="flex-shrink-0 w-32">
                        <video
                          src={clip.videoUrl}
                          className="w-full aspect-video bg-black rounded border border-zinc-700"
                          controls={false}
                        />
                        <p className="text-[10px] text-zinc-500 mt-1 truncate">
                          {clip.role === 'user' ? 'YOU' : selectedCharacter.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className="relative">
                      <div
                        onClick={() => toggleSelectMessage(message.id)}
                        className={`max-w-2xl px-4 py-3 rounded-lg cursor-pointer transition-all ${
                          message.role === 'user'
                            ? message.selected
                              ? 'bg-red-600 text-white'
                              : 'bg-zinc-800 text-white hover:bg-zinc-700'
                            : message.selected
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs text-zinc-400">
                            {message.role === 'user' ? 'YOU' : selectedCharacter.name.toUpperCase()}
                          </div>
                          {/* Voice Test Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestVoice(message.content, message.id);
                            }}
                            disabled={testingVoice === message.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                            {testingVoice === message.id ? (
                              <Volume2 size={14} className="text-blue-400 animate-pulse" />
                            ) : (
                              <Volume2 size={14} className="text-zinc-400 hover:text-blue-400" />
                            )}
                          </button>
                        </div>
                        <div className="text-sm leading-relaxed">{message.content}</div>
                        {message.selected && (
                          <div className="text-xs text-white/70 mt-2">✓ Selected for export</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-2xl px-4 py-3 rounded-lg bg-zinc-900">
                      <div className="text-xs text-zinc-400 mb-1">{selectedCharacter.name.toUpperCase()}</div>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-zinc-800 p-4 bg-zinc-950">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={`Say something as yourself...`}
                    className="flex-1 px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
                    disabled={isTyping}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Click messages to select them, then use "Insert to Script" or "Run Lines"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
