'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Star, Play, User, Zap, Filter } from 'lucide-react';
import { FIGHT_PRESETS, PRESET_CATEGORIES, PRESET_STYLES, FightPreset, PresetCategory } from '@/lib/preset-types';

export default function PresetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all');
  const [selectedPreset, setSelectedPreset] = useState<FightPreset | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Filter presets
  const filteredPresets = FIGHT_PRESETS.filter(preset => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category for display
  const featuredPresets = filteredPresets.filter(p => p.is_featured);

  const handleApplyPreset = (preset: FightPreset) => {
    setSelectedPreset(preset);
    setShowApplyModal(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/canvas" className="text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                FIGHT PRESETS
              </h1>
              <p className="text-xs text-zinc-500">Cinematic action templates - pick, load character, generate</p>
            </div>
          </div>
          <Link
            href="/canvas"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Open Canvas
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presets... (e.g., 'roundhouse', 'knockout')"
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              All
            </button>
            {(Object.keys(PRESET_CATEGORIES) as PresetCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span>{PRESET_CATEGORIES[category].icon}</span>
                {PRESET_CATEGORIES[category].label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        {selectedCategory === 'all' && featuredPresets.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              Featured Presets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredPresets.slice(0, 4).map((preset) => (
                <PresetCard key={preset.id} preset={preset} onApply={handleApplyPreset} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Presets by Category */}
        {selectedCategory === 'all' ? (
          // Show grouped by category
          (Object.keys(PRESET_CATEGORIES) as PresetCategory[]).map((category) => {
            const categoryPresets = filteredPresets.filter(p => p.category === category);
            if (categoryPresets.length === 0) return null;

            return (
              <div key={category} className="mb-10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">{PRESET_CATEGORIES[category].icon}</span>
                  {PRESET_CATEGORIES[category].label}
                  <span className="text-xs text-zinc-500 font-normal">({categoryPresets.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryPresets.map((preset) => (
                    <PresetCard key={preset.id} preset={preset} onApply={handleApplyPreset} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Show filtered category
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredPresets.map((preset) => (
              <PresetCard key={preset.id} preset={preset} onApply={handleApplyPreset} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredPresets.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🥊</div>
            <h2 className="text-2xl font-bold text-zinc-700 mb-2">No Presets Found</h2>
            <p className="text-zinc-500">
              {searchQuery ? 'Try a different search term' : 'No presets in this category yet'}
            </p>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-12 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="font-bold text-lg mb-4">How Presets Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <div>
                <h4 className="font-semibold mb-1">Pick a Preset</h4>
                <p className="text-sm text-zinc-400">Choose from our library of cinematic fight moves - punches, kicks, takedowns, combos</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <div>
                <h4 className="font-semibold mb-1">Load Your Character</h4>
                <p className="text-sm text-zinc-400">Use @name tags to reference your trained avatars, or upload a new character image</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <div>
                <h4 className="font-semibold mb-1">Generate</h4>
                <p className="text-sm text-zinc-400">Our AI applies the preset motion to your character with cinematic quality</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Collection Notice */}
        <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="text-yellow-500 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-semibold text-sm mb-1">Help Train Our Model</h4>
              <p className="text-xs text-zinc-400">
                Opted-in users contribute their best outputs to improve preset quality.
                Your generations help make the AI better for everyone.{' '}
                <Link href="/settings" className="text-red-500 hover:underline">Manage opt-in settings</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Preset Modal */}
      {showApplyModal && selectedPreset && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-2">{selectedPreset.name}</h3>
            <p className="text-sm text-zinc-400 mb-4">{selectedPreset.description}</p>

            <div className="bg-black rounded-lg aspect-video mb-4 flex items-center justify-center">
              {selectedPreset.preview_video_url ? (
                <video src={selectedPreset.preview_video_url} autoPlay loop muted className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-zinc-600 text-sm">Preview coming soon</div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Category</span>
                <span className="flex items-center gap-1">
                  {PRESET_CATEGORIES[selectedPreset.category].icon}
                  {PRESET_CATEGORIES[selectedPreset.category].label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Style</span>
                <span>{PRESET_STYLES[selectedPreset.style].label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Credits</span>
                <span className="text-yellow-500">{selectedPreset.credits_cost} credits</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">LoRA</span>
                <span className="text-green-500">{selectedPreset.lora_name || 'Standard'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <Link
                href={`/canvas?preset=${selectedPreset.id}`}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors text-center flex items-center justify-center gap-2"
              >
                <Play size={16} />
                Use Preset
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset Card Component
function PresetCard({
  preset,
  onApply,
  featured = false,
}: {
  preset: FightPreset;
  onApply: (preset: FightPreset) => void;
  featured?: boolean;
}) {
  return (
    <div
      onClick={() => onApply(preset)}
      className={`bg-zinc-900 border rounded-lg overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] ${
        featured ? 'border-yellow-600/50 hover:border-yellow-500' : 'border-zinc-800 hover:border-red-600'
      }`}
    >
      {/* Preview */}
      <div className="relative aspect-video bg-black">
        {preset.thumbnail_url ? (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className="text-4xl">{PRESET_CATEGORIES[preset.category].icon}</span>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className="text-4xl">{PRESET_CATEGORIES[preset.category].icon}</span>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <Play size={20} className="ml-1" />
          </div>
        </div>

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-600 text-black text-[10px] font-bold rounded">
            FEATURED
          </div>
        )}

        {/* Credits badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded">
          {preset.credits_cost} cr
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-1 group-hover:text-red-500 transition-colors">
          {preset.name}
        </h3>
        <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{preset.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <Star size={10} className="text-yellow-500" />
            <span>{preset.rating}</span>
            <span className="mx-1">·</span>
            <span>{preset.uses_count} uses</span>
          </div>

          {preset.lora_name && (
            <span className="text-[10px] px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded">
              LoRA
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
