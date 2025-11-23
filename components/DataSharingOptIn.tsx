'use client';

import { useState, useEffect } from 'react';
import { Database, Shield, Percent } from 'lucide-react';

interface DataSharingOptInProps {
  userId: string;
  initialOptIn?: boolean;
  onOptInChange?: (optedIn: boolean) => void;
}

export default function DataSharingOptIn({
  userId,
  initialOptIn = false,
  onOptInChange,
}: DataSharingOptInProps) {
  const [isOptedIn, setIsOptedIn] = useState(initialOptIn);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Fetch current opt-in status
    const fetchOptInStatus = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/user/data-sharing-status?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setIsOptedIn(data.opted_in);
        }
      } catch (error) {
        console.error('Failed to fetch opt-in status:', error);
      }
    };

    fetchOptInStatus();
  }, [userId]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/update-data-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opt_in: !isOptedIn,
          userId: userId
        }),
      });

      if (response.ok) {
        const newStatus = !isOptedIn;
        setIsOptedIn(newStatus);
        onOptInChange?.(newStatus);
      } else {
        const data = await response.json();
        alert('Failed to update: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating opt-in:', error);
      alert('Error updating preference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Training Data Sharing
              {isOptedIn && (
                <span className="px-2 py-0.5 bg-green-600/20 border border-green-600/50 rounded text-xs text-green-400 font-normal">
                  ACTIVE
                </span>
              )}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Help us build better AI models and save on membership
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative w-14 h-7 rounded-full transition-all ${
            isOptedIn ? 'bg-green-600' : 'bg-zinc-700'
          } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          <div
            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
              isOptedIn ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="flex items-start gap-2 p-3 bg-black/40 rounded-lg">
          <Percent size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">10% Discount</p>
            <p className="text-xs text-zinc-500">On all membership tiers</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-black/40 rounded-lg">
          <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Fully Transparent</p>
            <p className="text-xs text-zinc-500">Toggle on/off anytime</p>
          </div>
        </div>
      </div>

      {/* What We Collect - Expandable */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-zinc-400 hover:text-white transition-colors underline mb-2"
      >
        {showDetails ? '▼' : '▶'} What data is shared?
      </button>

      {showDetails && (
        <div className="bg-black/60 border border-zinc-800 rounded-lg p-4 space-y-2 text-sm text-zinc-300">
          <p className="font-medium text-white mb-2">When opted in, we collect:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Generated images and videos you create</li>
            <li>The prompts and settings you used</li>
            <li>Character references (if applicable)</li>
            <li>Input images (for sketch-to-image, etc.)</li>
          </ul>
          <p className="text-xs text-zinc-500 mt-3 pt-3 border-t border-zinc-800">
            <span className="font-medium text-zinc-400">Privacy:</span> Your data is used exclusively
            to train our proprietary AI models. We never share, sell, or use your content for any other
            purpose. You can opt out at any time, and previously shared data will be retained only for
            model training.
          </p>
        </div>
      )}

      {/* Status Message */}
      {isOptedIn ? (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
          <p className="text-xs text-green-400">
            ✓ You're contributing to better AI models! Your 10% discount is automatically applied
            to all membership purchases.
          </p>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-500">
            Opt in to share your outputs and unlock a 10% discount on all membership tiers.
          </p>
        </div>
      )}
    </div>
  );
}
