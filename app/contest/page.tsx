'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Upload, Heart, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ContestPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('contest_submissions')
      .select('*')
      .eq('contest_month', currentMonth)
      .order('votes', { ascending: false });

    if (data) setSubmissions(data);
    setIsLoading(false);
  };

  const handleVote = async (submissionId: string) => {
    // TODO: Implement voting logic with user authentication
    alert('Voting feature coming soon! Requires user authentication.');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent flex items-center gap-2">
              <Trophy size={28} />
              FIRST AKTION HERO
            </h1>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Upload size={18} />
            Submit Entry ($10)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Contest Info Banner */}
        <div className="bg-gradient-to-r from-red-900/50 to-zinc-900/50 border border-red-800 rounded-lg p-8 mb-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <DollarSign className="text-red-500 mx-auto mb-3" size={40} />
              <h3 className="font-bold text-2xl mb-2">$10 Entry</h3>
              <p className="text-sm text-zinc-400">First submission. $5 for subsequent entries.</p>
            </div>
            <div className="text-center">
              <Trophy className="text-yellow-500 mx-auto mb-3" size={40} />
              <h3 className="font-bold text-2xl mb-2">Grand Prize</h3>
              <p className="text-sm text-zinc-400">6 months free + 30% of prize pool</p>
            </div>
            <div className="text-center">
              <Calendar className="text-blue-500 mx-auto mb-3" size={40} />
              <h3 className="font-bold text-2xl mb-2">Monthly</h3>
              <p className="text-sm text-zinc-400">New contest every month. Community voting.</p>
            </div>
          </div>
        </div>

        {/* Contest Rules */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Contest Rules</h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• Submit 1-3 minute action hero scene</li>
            <li>• First entry: $10, subsequent entries: $5</li>
            <li>• Winner gets 6 months free subscription + 30% of prize pool</li>
            <li>• Remaining 70% goes to development and scaling</li>
            <li>• Community voting determines the winner</li>
            <li>• One vote per user per submission</li>
            <li>• Contest ends last day of each month</li>
          </ul>
        </div>

        {/* Current Submissions */}
        <h2 className="text-2xl font-bold mb-6">
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Submissions
        </h2>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-500">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-zinc-700 mb-2">No Submissions Yet</h2>
            <p className="text-zinc-500">Be the first to submit your action hero scene!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-red-600 transition-all group"
              >
                {/* Video Thumbnail/Player */}
                <div className="aspect-video bg-zinc-950">
                  <video
                    src={submission.video_url}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Submission Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-red-500 transition-colors">
                    {submission.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                    {submission.description || 'No description provided'}
                  </p>

                  {/* Voting */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleVote(submission.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-600 rounded-lg transition-colors text-sm"
                    >
                      <Heart size={16} />
                      <span>{submission.votes} votes</span>
                    </button>
                    <span className="text-xs text-zinc-600">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Submit Your Entry</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  placeholder="My Epic Action Scene"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  placeholder="Describe your action sequence..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Video File (1-3 minutes)</label>
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-red-600 transition-colors cursor-pointer">
                  <Upload className="mx-auto mb-3 text-zinc-600" size={40} />
                  <p className="text-sm text-zinc-400">Click to upload or drag and drop</p>
                  <p className="text-xs text-zinc-600 mt-1">MP4, MOV, or AVI (max 500MB)</p>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Entry Fee: $10</strong> (or $5 if you've already submitted this month)
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Payment will be processed when you submit your entry.
                </p>
              </div>

              <button className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-colors">
                Submit & Pay $10
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
