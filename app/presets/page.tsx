'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Star, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PresetsPage() {
  const [presets, setPresets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('presets')
      .select('*')
      .eq('is_public', true)
      .order('uses_count', { ascending: false })
      .limit(50);

    if (data) setPresets(data);
    setIsLoading(false);
  };

  const filteredPresets = presets.filter(preset =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              PRESET LIBRARY
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search presets..."
            className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Presets Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-500">Loading presets...</p>
          </div>
        ) : filteredPresets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-zinc-700 mb-2">No Presets Found</h2>
            <p className="text-zinc-500">
              {searchQuery ? 'Try a different search term' : 'Be the first to create a preset!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-red-600 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-lg group-hover:text-red-500 transition-colors">
                    {preset.name}
                  </h3>
                  <button className="text-zinc-600 hover:text-red-500 transition-colors">
                    <Download size={18} />
                  </button>
                </div>
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                  {preset.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500" />
                    {preset.uses_count} uses
                  </span>
                  <span>{new Date(preset.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-12 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="font-semibold mb-2">About Preset Library</h3>
          <p className="text-sm text-zinc-400">
            Browse and download community-created presets for your action sequences. Save your own presets and share them with the community.
            Presets include camera angles, movement patterns, effect settings, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
