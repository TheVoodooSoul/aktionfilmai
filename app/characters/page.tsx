'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Upload, Sparkles, Video, Image as ImageIcon, User, CheckCircle, Clock, AlertCircle, Info, Trash2, Mic, UserCircle } from 'lucide-react';

interface A2EAvatar {
  _id: string;
  type: 'custom' | 'default';
  video_cover: string;
  base_video: string;
  createdAt: string;
  user_video_twin_id?: string;
}

export default function CharactersPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [avatars, setAvatars] = useState<A2EAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'t2i' | 'video' | 'image'>('video');

  // T2I form
  const [t2iPrompt, setT2iPrompt] = useState('');
  const [t2iName, setT2iName] = useState('');
  const [t2iGender, setT2iGender] = useState<'male' | 'female'>('male');
  const [generatingT2I, setGeneratingT2I] = useState(false);

  // Video upload form
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState('');
  const [videoGender, setVideoGender] = useState<'male' | 'female'>('male');
  const [videoBgType, setVideoBgType] = useState<'none' | 'color' | 'image'>('none');
  const [videoBgColor, setVideoBgColor] = useState('rgb(0,255,0)'); // Green screen default
  const [videoBgImage, setVideoBgImage] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Image upload form
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageName, setImageName] = useState('');
  const [imageGender, setImageGender] = useState<'male' | 'female'>('male');
  const [imagePrompt, setImagePrompt] = useState('fixed shot, still background, the person is speaking, clear teeth, natural blink');
  const [imageNegativePrompt, setImageNegativePrompt] = useState('moving background, six fingers, bad hands, low quality, worst quality, moving viewpoint');
  const [imageBgType, setImageBgType] = useState<'none' | 'color' | 'image'>('none');
  const [imageBgColor, setImageBgColor] = useState('rgb(255,255,255)'); // White default
  const [imageBgImage, setImageBgImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Continue training state
  const [continuingTraining, setContinuingTraining] = useState<string | null>(null);

  // Remove avatar state
  const [removingAvatar, setRemovingAvatar] = useState<string | null>(null);

  // Background library state
  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [loadingBackgrounds, setLoadingBackgrounds] = useState(false);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [deletingBackground, setDeletingBackground] = useState<string | null>(null);

  // Voice library state
  const [publicVoices, setPublicVoices] = useState<any[]>([]);
  const [voiceClones, setVoiceClones] = useState<any[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'all' | 'male' | 'female'>('all');

  // Face library state
  const [faces, setFaces] = useState<any[]>([]);
  const [loadingFaces, setLoadingFaces] = useState(false);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [deletingFace, setDeletingFace] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadCredits(user.id);
        loadAvatars();
        loadBackgrounds();
        loadVoices();
        loadFaces();
      }
    }
    getUser();
  }, []);

  async function loadCredits(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  }

  async function loadAvatars() {
    setLoading(true);
    try {
      const response = await fetch('/api/a2e/list-avatars');
      if (response.ok) {
        const data = await response.json();
        setAvatars(data.avatars || []);
      }
    } catch (error) {
      console.error('Failed to load avatars:', error);
    }
    setLoading(false);
  }

  async function loadBackgrounds() {
    setLoadingBackgrounds(true);
    try {
      const response = await fetch('/api/a2e/backgrounds/list', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setBackgrounds(data.backgrounds || []);
      }
    } catch (error) {
      console.error('Failed to load backgrounds:', error);
    }
    setLoadingBackgrounds(false);
  }

  async function loadVoices() {
    setLoadingVoices(true);
    try {
      const [publicResponse, clonesResponse] = await Promise.all([
        fetch('/api/a2e/voices/list-public'),
        fetch('/api/a2e/voices/list-clones'),
      ]);

      if (publicResponse.ok) {
        const data = await publicResponse.json();
        setPublicVoices(data.voices || []);
      }

      if (clonesResponse.ok) {
        const data = await clonesResponse.json();
        setVoiceClones(data.voiceClones || []);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
    setLoadingVoices(false);
  }

  async function loadFaces() {
    setLoadingFaces(true);
    try {
      const response = await fetch('/api/a2e/faces/list');
      if (response.ok) {
        const data = await response.json();
        setFaces(data.faces || []);
      }
    } catch (error) {
      console.error('Failed to load faces:', error);
    }
    setLoadingFaces(false);
  }

  async function handleT2IGenerate() {
    if (!t2iPrompt.trim() || !t2iName.trim()) {
      alert('Please enter both character name and description');
      return;
    }

    setGeneratingT2I(true);
    try {
      const genResponse = await fetch('/api/a2e/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: t2iPrompt,
          userId: user?.id,
          trainAvatar: false,
        }),
      });

      const genData = await genResponse.json();
      if (!genResponse.ok) {
        throw new Error(genData.error || 'Failed to generate character');
      }

      const taskId = genData.task_id;

      const avatarResponse = await fetch('/api/a2e/quick-add-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: taskId,
          name: t2iName,
          gender: t2iGender,
          userId: user?.id,
        }),
      });

      const avatarData = await avatarResponse.json();
      if (!avatarResponse.ok) {
        throw new Error(avatarData.error || 'Failed to create avatar');
      }

      alert(`✅ Character "${t2iName}" created with avatar!`);
      setT2iPrompt('');
      setT2iName('');
      loadAvatars();
    } catch (error: any) {
      console.error('T2I error:', error);
      alert('Failed to generate character: ' + error.message);
    } finally {
      setGeneratingT2I(false);
    }
  }

  async function handleVideoUpload() {
    if (!videoFile || !videoName.trim()) {
      alert('Please select a video and enter avatar name');
      return;
    }

    setUploadingVideo(true);
    try {
      // Upload video
      const fileName = `${user?.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('character-uploads')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(fileName);

      // Upload background image if provided
      let bgImageUrl = undefined;
      if (videoBgType === 'image' && videoBgImage) {
        const bgFileName = `${user?.id}/${Date.now()}-bg-${videoBgImage.name}`;
        const { error: bgError } = await supabase.storage
          .from('character-uploads')
          .upload(bgFileName, videoBgImage);

        if (!bgError) {
          const { data: { publicUrl } } = supabase.storage
            .from('character-uploads')
            .getPublicUrl(bgFileName);
          bgImageUrl = publicUrl;
        }
      }

      // Train avatar
      const response = await fetch('/api/a2e/train-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoUrl,
          name: videoName,
          gender: videoGender,
          backgroundColor: videoBgType === 'color' ? videoBgColor : undefined,
          backgroundImage: bgImageUrl,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to train avatar');
      }

      alert(`✅ Avatar "${videoName}" training started (10 credits)! Check back in a few minutes.`);
      setVideoFile(null);
      setVideoName('');
      setVideoBgImage(null);
      loadAvatars();
    } catch (error: any) {
      console.error('Video upload error:', error);
      alert('Failed to upload video: ' + error.message);
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleImageUpload() {
    if (!imageFile || !imageName.trim()) {
      alert('Please select an image and enter avatar name');
      return;
    }

    setUploadingImage(true);
    try {
      // Upload image
      const fileName = `${user?.id}/${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('character-uploads')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: imageUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(fileName);

      // Upload background image if provided
      let bgImageUrl = undefined;
      if (imageBgType === 'image' && imageBgImage) {
        const bgFileName = `${user?.id}/${Date.now()}-bg-${imageBgImage.name}`;
        const { error: bgError } = await supabase.storage
          .from('character-uploads')
          .upload(bgFileName, imageBgImage);

        if (!bgError) {
          const { data: { publicUrl } } = supabase.storage
            .from('character-uploads')
            .getPublicUrl(bgFileName);
          bgImageUrl = publicUrl;
        }
      }

      // Train avatar
      const response = await fetch('/api/a2e/train-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl,
          name: imageName,
          gender: imageGender,
          prompt: imagePrompt,
          negativePrompt: imageNegativePrompt,
          backgroundColor: imageBgType === 'color' ? imageBgColor : undefined,
          backgroundImage: bgImageUrl,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to train avatar');
      }

      alert(`✅ Avatar "${imageName}" training started (30 credits)! Check back in a few minutes.`);
      setImageFile(null);
      setImageName('');
      setImageBgImage(null);
      loadAvatars();
    } catch (error: any) {
      console.error('Image upload error:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleContinueTraining(avatarId: string) {
    if (!confirm('Continue training will create a Studio Avatar 💠 with improved lip-sync quality. This costs 20 credits. Continue?')) {
      return;
    }

    setContinuingTraining(avatarId);
    try {
      const response = await fetch('/api/a2e/continue-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: avatarId,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to continue training');
      }

      alert('✅ Studio Avatar training started! Check back in a few minutes for improved lip-sync quality.');
      loadAvatars();
    } catch (error: any) {
      console.error('Continue training error:', error);
      alert('Failed to continue training: ' + error.message);
    } finally {
      setContinuingTraining(null);
    }
  }

  async function handleRemoveAvatar(avatarId: string) {
    if (!confirm('⚠️ Are you sure you want to permanently delete this avatar? This action cannot be undone and credits will NOT be refunded.')) {
      return;
    }

    setRemovingAvatar(avatarId);
    try {
      const response = await fetch('/api/a2e/remove-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: avatarId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove avatar');
      }

      alert('✅ Avatar removed successfully');
      loadAvatars();
    } catch (error: any) {
      console.error('Remove avatar error:', error);
      alert('Failed to remove avatar: ' + error.message);
    } finally {
      setRemovingAvatar(null);
    }
  }

  async function handleUploadBackground() {
    if (!backgroundFile) {
      alert('Please select a background image');
      return;
    }

    setUploadingBackground(true);
    try {
      // Upload to Supabase
      const fileName = `${user?.id}/backgrounds/${Date.now()}-${backgroundFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('character-uploads')
        .upload(fileName, backgroundFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(fileName);

      // Add to A2E library
      const response = await fetch('/api/a2e/backgrounds/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: publicUrl,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add background');
      }

      alert(`✅ Background added to library (${data.cost} credits)`);
      setBackgroundFile(null);
      loadBackgrounds();
    } catch (error: any) {
      console.error('Upload background error:', error);
      alert('Failed to upload background: ' + error.message);
    } finally {
      setUploadingBackground(false);
    }
  }

  async function handleDeleteBackground(backgroundId: string) {
    if (!confirm('Delete this background from your library?')) {
      return;
    }

    setDeletingBackground(backgroundId);
    try {
      const response = await fetch('/api/a2e/backgrounds/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundId: backgroundId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete background');
      }

      alert('✅ Background deleted');
      loadBackgrounds();
    } catch (error: any) {
      console.error('Delete background error:', error);
      alert('Failed to delete background: ' + error.message);
    } finally {
      setDeletingBackground(null);
    }
  }

  async function handleUploadFace() {
    if (!faceFile) {
      alert('Please select a face image');
      return;
    }

    setUploadingFace(true);
    try {
      // Upload to Supabase
      const fileName = `${user?.id}/faces/${Date.now()}-${faceFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('character-uploads')
        .upload(fileName, faceFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-uploads')
        .getPublicUrl(fileName);

      // Add to A2E library
      const response = await fetch('/api/a2e/faces/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceUrl: publicUrl,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add face');
      }

      alert(`✅ Face added to library (${data.cost} credits)`);
      setFaceFile(null);
      loadFaces();
    } catch (error: any) {
      console.error('Upload face error:', error);
      alert('Failed to upload face: ' + error.message);
    } finally {
      setUploadingFace(false);
    }
  }

  async function handleDeleteFace(faceId: string) {
    if (!confirm('Delete this face from your library?')) {
      return;
    }

    setDeletingFace(faceId);
    try {
      const response = await fetch('/api/a2e/faces/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceId: faceId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete face');
      }

      alert('✅ Face deleted');
      loadFaces();
    } catch (error: any) {
      console.error('Delete face error:', error);
      alert('Failed to delete face: ' + error.message);
    } finally {
      setDeletingFace(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">CHARACTER STUDIO</h1>
              <p className="text-sm text-zinc-500 mt-1">Train your action hero avatars with A2E AI</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-white">{credits.toLocaleString()}</span>
                  <span className="text-sm text-zinc-400">credits</span>
                </div>
              </div>
              <button
                onClick={() => router.push('/canvas')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
              >
                Canvas
              </button>
              <button
                onClick={() => router.push('/writers-room/improv')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                Writers Room →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Creation Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-red-500" />
            Create Avatar (Following A2E Best Practices)
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                activeTab === 'video'
                  ? 'text-green-500 border-green-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <Video size={16} className="inline mr-2" />
              Upload Video (10 credits) - Recommended!
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                activeTab === 'image'
                  ? 'text-orange-500 border-orange-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <ImageIcon size={16} className="inline mr-2" />
              Upload Image (30 credits)
            </button>
            <button
              onClick={() => setActiveTab('t2i')}
              className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                activeTab === 't2i'
                  ? 'text-red-500 border-red-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              }`}
            >
              <User size={16} className="inline mr-2" />
              Text-to-Image (10 credits)
            </button>
          </div>

          {/* Video Upload Form */}
          {activeTab === 'video' && (
            <div className="space-y-4">
              <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <Info size={16} />
                  A2E Video Requirements (5-30 seconds recommended)
                </h3>
                <ul className="text-xs text-blue-300 space-y-1 list-disc list-inside">
                  <li>Single face only, facing forward</li>
                  <li>Face width = 1/10 to 1/3 of frame width</li>
                  <li>720P-1080P resolution (max 4K)</li>
                  <li>5 seconds - 5 minutes duration</li>
                  <li>**Speak normally as your character** - audio + lip sync important!</li>
                  <li>No background noise, moderate speaking speed</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Avatar Name</label>
                  <input
                    type="text"
                    value={videoName}
                    onChange={(e) => setVideoName(e.target.value)}
                    placeholder="e.g. Thunder Jackson"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Gender</label>
                  <select
                    value={videoGender}
                    onChange={(e) => setVideoGender(e.target.value as 'male' | 'female')}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Video File (5s-5min, speaking recommended)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white file:font-semibold hover:file:bg-green-700"
                />
              </div>

              {/* Background Options */}
              <div>
                <label className="block text-sm font-semibold mb-2">Original Background (Optional)</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setVideoBgType('none')}
                    className={`px-3 py-1 rounded ${videoBgType === 'none' ? 'bg-green-600' : 'bg-zinc-800'}`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setVideoBgType('color')}
                    className={`px-3 py-1 rounded ${videoBgType === 'color' ? 'bg-green-600' : 'bg-zinc-800'}`}
                  >
                    Color (Green Screen)
                  </button>
                  <button
                    onClick={() => setVideoBgType('image')}
                    className={`px-3 py-1 rounded ${videoBgType === 'image' ? 'bg-green-600' : 'bg-zinc-800'}`}
                  >
                    Upload Image
                  </button>
                </div>

                {videoBgType === 'color' && (
                  <input
                    type="text"
                    value={videoBgColor}
                    onChange={(e) => setVideoBgColor(e.target.value)}
                    placeholder="rgb(0,255,0)"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  />
                )}

                {videoBgType === 'image' && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setVideoBgImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white"
                  />
                )}
              </div>

              <button
                onClick={handleVideoUpload}
                disabled={uploadingVideo}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
              >
                {uploadingVideo ? 'Uploading & Training...' : 'Upload Video & Train Avatar (10 credits)'}
              </button>
            </div>
          )}

          {/* Image Upload Form */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="bg-orange-950/30 border border-orange-800 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-bold text-orange-400 mb-2 flex items-center gap-2">
                  <Info size={16} />
                  A2E Image Requirements
                </h3>
                <ul className="text-xs text-orange-300 space-y-1 list-disc list-inside">
                  <li>Person facing forward (both ears visible)</li>
                  <li>Single face only</li>
                  <li>Face width = 1/10 to 1/3 of image width</li>
                  <li>Clear facial features, not obscured</li>
                  <li>Max 10MB, max 4000px width/height</li>
                  <li>Vertical or horizontal (not square!)</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Avatar Name</label>
                  <input
                    type="text"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    placeholder="e.g. Steel Reaper"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Gender</label>
                  <select
                    value={imageGender}
                    onChange={(e) => setImageGender(e.target.value as 'male' | 'female')}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Image File (under 10MB, under 4000px)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white file:font-semibold hover:file:bg-orange-700"
                />
              </div>

              {/* Prompt Fields */}
              <div>
                <label className="block text-sm font-semibold mb-2">Prompt (Animation Style)</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Negative Prompt</label>
                <textarea
                  value={imageNegativePrompt}
                  onChange={(e) => setImageNegativePrompt(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Background Options */}
              <div>
                <label className="block text-sm font-semibold mb-2">Original Background (Optional)</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setImageBgType('none')}
                    className={`px-3 py-1 rounded ${imageBgType === 'none' ? 'bg-orange-600' : 'bg-zinc-800'}`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setImageBgType('color')}
                    className={`px-3 py-1 rounded ${imageBgType === 'color' ? 'bg-orange-600' : 'bg-zinc-800'}`}
                  >
                    Color
                  </button>
                  <button
                    onClick={() => setImageBgType('image')}
                    className={`px-3 py-1 rounded ${imageBgType === 'image' ? 'bg-orange-600' : 'bg-zinc-800'}`}
                  >
                    Upload Image
                  </button>
                </div>

                {imageBgType === 'color' && (
                  <input
                    type="text"
                    value={imageBgColor}
                    onChange={(e) => setImageBgColor(e.target.value)}
                    placeholder="rgb(255,255,255)"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg"
                  />
                )}

                {imageBgType === 'image' && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageBgImage(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white"
                  />
                )}
              </div>

              <button
                onClick={handleImageUpload}
                disabled={uploadingImage}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
              >
                {uploadingImage ? 'Uploading & Training...' : 'Upload Image & Train Avatar (30 credits)'}
              </button>
            </div>
          )}

          {/* T2I Form (existing) */}
          {activeTab === 't2i' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Character Name</label>
                  <input
                    type="text"
                    value={t2iName}
                    onChange={(e) => setT2iName(e.target.value)}
                    placeholder="e.g. Jake 'Thunder' Martinez"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Gender</label>
                  <select
                    value={t2iGender}
                    onChange={(e) => setT2iGender(e.target.value as 'male' | 'female')}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Character Description</label>
                <textarea
                  value={t2iPrompt}
                  onChange={(e) => setT2iPrompt(e.target.value)}
                  placeholder="muscular action hero, buzz cut, tactical vest, intense gaze, cinematic lighting"
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={handleT2IGenerate}
                disabled={generatingT2I}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
              >
                {generatingT2I ? 'Generating + Training...' : 'Generate & Quick Add Avatar (10 credits)'}
              </button>
            </div>
          )}
        </div>

        {/* Avatar Gallery */}
        <div>
          <h2 className="text-lg font-bold mb-4">Your Avatars</h2>
          {loading ? (
            <div className="text-center py-12 text-zinc-500">Loading avatars...</div>
          ) : avatars.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-zinc-800 rounded-xl">
              No avatars yet. Create your first avatar above! (Video recommended - 5-30s speaking)
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {avatars.map((avatar) => (
                <div
                  key={avatar._id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-500 transition-all group"
                >
                  <div className="relative aspect-[2/3] bg-zinc-900">
                    <img
                      src={avatar.video_cover}
                      alt={`Avatar ${avatar._id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = avatar.base_video;
                      }}
                    />
                    {avatar.type === 'custom' && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-green-600 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} />
                        <span className="text-xs font-bold">READY</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-black text-white text-sm mb-1">Avatar ID: {avatar._id.substring(0, 8)}...</h3>
                    <p className="text-xs text-zinc-500 mb-3">
                      {avatar.type === 'custom' ? 'Your Custom Avatar' : 'System Avatar'}
                    </p>

                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => router.push(`/writers-room/improv?avatar=${avatar._id}`)}
                        className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Writers Room
                      </button>
                      <button
                        onClick={() => window.open(avatar.base_video, '_blank')}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Preview
                      </button>
                    </div>

                    {avatar.type === 'custom' && (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleContinueTraining(avatar._id)}
                          disabled={continuingTraining === avatar._id}
                          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          {continuingTraining === avatar._id ? (
                            <>
                              <Clock size={12} className="animate-spin" />
                              Training...
                            </>
                          ) : (
                            <>
                              💠 Continue Training (Studio Avatar)
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveAvatar(avatar._id)}
                          disabled={removingAvatar === avatar._id}
                          className="w-full px-3 py-2 bg-zinc-800 hover:bg-red-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          {removingAvatar === avatar._id ? (
                            <>
                              <Clock size={12} className="animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <Trash2 size={12} />
                              Delete Avatar
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice Library */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Mic size={20} className="text-blue-500" />
            Voice Library (TTS Options)
          </h2>

          {loadingVoices ? (
            <div className="text-center py-12 text-zinc-500">Loading voices...</div>
          ) : (
            <div>
              {/* Voice Clones Section */}
              {voiceClones.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold mb-3 text-blue-400">Your Custom Voice Clones</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {voiceClones.map((voice) => (
                      <div
                        key={voice._id}
                        className="bg-zinc-950 border border-blue-800 rounded-xl p-4 hover:border-blue-500 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-white">{voice.name}</h4>
                            <p className="text-xs text-zinc-500">
                              {voice.gender} • {voice.lang || 'en-US'}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-blue-600 rounded-full text-xs font-bold">
                            ✨ Clone
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">ID: {voice._id.substring(0, 12)}...</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Voices Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-zinc-400">Public TTS Voices</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedGender('all')}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        selectedGender === 'all' ? 'bg-blue-600' : 'bg-zinc-800'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedGender('female')}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        selectedGender === 'female' ? 'bg-blue-600' : 'bg-zinc-800'
                      }`}
                    >
                      Female
                    </button>
                    <button
                      onClick={() => setSelectedGender('male')}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        selectedGender === 'male' ? 'bg-blue-600' : 'bg-zinc-800'
                      }`}
                    >
                      Male
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {publicVoices
                    .filter((gender) => selectedGender === 'all' || gender.value === selectedGender)
                    .flatMap((gender) => gender.children || [])
                    .map((voice: any) => (
                      <div
                        key={voice.value}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 hover:border-blue-500 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Mic size={14} className="text-blue-400" />
                          <h4 className="text-xs font-bold text-white truncate">{voice.label}</h4>
                        </div>
                        <p className="text-xs text-zinc-500 truncate">ID: {voice.value.substring(0, 8)}...</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Face Library */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <UserCircle size={20} className="text-orange-500" />
            Face Library (Face Swap)
          </h2>

          {/* Upload Face */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-bold mb-3">Add Face for Swapping (3 credits)</h3>
            <p className="text-xs text-zinc-500 mb-4">Upload face images to use for face swapping in videos and images.</p>
            <div className="flex gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFaceFile(e.target.files?.[0] || null)}
                className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white"
              />
              <button
                onClick={handleUploadFace}
                disabled={uploadingFace || !faceFile}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {uploadingFace ? 'Uploading...' : 'Add to Library'}
              </button>
            </div>
          </div>

          {/* Face Grid */}
          {loadingFaces ? (
            <div className="text-center py-12 text-zinc-500">Loading faces...</div>
          ) : faces.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-zinc-800 rounded-xl">
              No faces in library yet. Upload your first face above!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {faces.map((face) => (
                <div
                  key={face._id}
                  className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500 transition-all group"
                >
                  <div className="aspect-square bg-zinc-900">
                    <img
                      src={face.face_url}
                      alt={`Face ${face._id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteFace(face._id)}
                    disabled={deletingFace === face._id}
                    className="absolute bottom-2 right-2 p-2 bg-red-600/80 hover:bg-red-700 disabled:bg-zinc-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deletingFace === face._id ? (
                      <Clock size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Background Library */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ImageIcon size={20} className="text-purple-500" />
            Background Library
          </h2>

          {/* Upload Background */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-bold mb-3">Add Custom Background (5 credits)</h3>
            <p className="text-xs text-zinc-500 mb-4">Upload backgrounds to use during video generation. Works with avatars that support background swap.</p>
            <div className="flex gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBackgroundFile(e.target.files?.[0] || null)}
                className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-600 file:text-white"
              />
              <button
                onClick={handleUploadBackground}
                disabled={uploadingBackground || !backgroundFile}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {uploadingBackground ? 'Uploading...' : 'Add to Library'}
              </button>
            </div>
          </div>

          {/* Background Grid */}
          {loadingBackgrounds ? (
            <div className="text-center py-12 text-zinc-500">Loading backgrounds...</div>
          ) : backgrounds.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-zinc-800 rounded-xl">
              No backgrounds in library yet. Upload your first background above!
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {backgrounds.map((bg) => (
                <div
                  key={bg._id}
                  className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500 transition-all group"
                >
                  <div className="aspect-video bg-zinc-900">
                    <img
                      src={bg.url}
                      alt={`Background ${bg._id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded-full">
                    <span className="text-xs font-bold">{bg.type === 'custom' ? '✨ Custom' : '🌐 System'}</span>
                  </div>
                  {bg.type === 'custom' && (
                    <button
                      onClick={() => handleDeleteBackground(bg._id)}
                      disabled={deletingBackground === bg._id}
                      className="absolute bottom-2 right-2 p-2 bg-red-600/80 hover:bg-red-700 disabled:bg-zinc-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {deletingBackground === bg._id ? (
                        <Clock size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
