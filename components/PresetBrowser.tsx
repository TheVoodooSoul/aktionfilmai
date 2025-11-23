'use client';

import { useState, useEffect } from 'react';
import { Search, Star, Play, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Preset {
  id: string;
  name: string;
  description: string;
  preset_data: {
    type: string;
    category: string;
    video_url: string;
    duration: number;
    difficulty: string;
    tags: string[];
    thumbnail_url?: string;
  };
  uses_count: number;
  created_at: string;
}

interface PresetBrowserProps {
  onSelectPreset: (preset: Preset) => void;
  selectedCategory?: string;
}

export default function PresetBrowser({ onSelectPreset, selectedCategory }: PresetBrowserProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(selectedCategory || 'all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, [category]);

  const loadPresets = async () => {
    setIsLoading(true);
    let query = supabase
      .from('presets')
      .select('*')
      .eq('is_public', true)
      .order('uses_count', { ascending: false });

    // Filter by category if not 'all'
    if (category !== 'all') {
      query = query.eq('preset_data->category', category);
    }

    const { data } = await query.limit(50);

    if (data) setPresets(data as Preset[]);
    setIsLoading(false);
  };

  const filteredPresets = presets.filter(preset =>
    preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.preset_data?.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = [
    { id: 'all', name: 'All Moves', icon: '🥋' },
    { id: 'punch', name: 'Punches', icon: '👊' },
    { id: 'kick', name: 'Kicks', icon: '🦵' },
    { id: 'block', name: 'Blocks', icon: '🛡️' },
    { id: 'dodge', name: 'Dodges', icon: '💨' },
    { id: 'grapple', name: 'Grapples', icon: '🤼' },
    { id: 'weapon', name: 'Weapons', icon: '⚔️' },
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-3">Fight Move Library</h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search moves..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat.id
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-zinc-500 text-sm">Loading fight moves...</p>
          </div>
        ) : filteredPresets.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">🥋</div>
            <h3 className="text-lg font-bold text-zinc-700 mb-2">No Moves Found</h3>
            <p className="text-zinc-500 text-sm">
              {searchQuery ? 'Try a different search' : 'No fight moves available yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-red-600 transition-all group cursor-pointer"
                onClick={() => onSelectPreset(preset)}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {preset.preset_data?.thumbnail_url ? (
                      <img
                        src={preset.preset_data.thumbnail_url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play size={24} className="text-zinc-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-white group-hover:text-red-500 transition-colors truncate">
                        {preset.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPreset(preset);
                        }}
                        className="text-red-600 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400 mb-2 line-clamp-1">
                      {preset.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span>{preset.preset_data?.duration?.toFixed(1)}s</span>
                      <span className="capitalize">{preset.preset_data?.difficulty}</span>
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" />
                        {preset.uses_count}
                      </span>
                    </div>

                    {/* Tags */}
                    {preset.preset_data?.tags && preset.preset_data.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {preset.preset_data.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
