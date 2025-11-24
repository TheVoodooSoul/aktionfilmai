'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Heart, ExternalLink, DollarSign, Users, Award, Calendar } from 'lucide-react';
import Footer from '@/components/Footer';
import DiscordWidget from '@/components/DiscordWidget';

export default function ContestVotePage() {
  const [user, setUser] = useState<any>(null);
  const [contest, setContest] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadSubmissions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSubmissions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/contest/submissions?contestId=first-christmas-2024');
      const data = await response.json();

      if (response.ok) {
        setContest(data.contest);
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!user) {
      alert('Please sign in to vote');
      return;
    }

    if (userVotes.has(submissionId)) {
      alert('You have already voted for this submission');
      return;
    }

    try {
      const response = await fetch('/api/contest/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          userId: user.id,
          voteType: 'community',
        }),
      });

      if (response.ok) {
        setUserVotes(new Set(userVotes).add(submissionId));
        loadSubmissions(); // Refresh to show new vote count
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote error:', error);
      alert('Failed to vote');
    }
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (sortBy === 'votes') {
      return b.community_votes - a.community_votes;
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const totalPot = contest?.total_pot || 0;
  const prizeAmount = Math.floor(totalPot * 0.15); // 15% of pot

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
              AKTION HERO CONTEST
            </h1>
          </div>
          <Link
            href="/contest"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition-colors"
          >
            Submit Entry
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Prize Pool Ticker */}
        <div className="bg-gradient-to-r from-green-900/30 to-yellow-900/30 border border-green-600/50 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <DollarSign className="text-green-500 mx-auto mb-2" size={32} />
              <h3 className="text-3xl font-black text-green-400">${(totalPot / 100).toFixed(2)}</h3>
              <p className="text-sm text-zinc-400">Total Prize Pool</p>
            </div>
            <div className="text-center">
              <Award className="text-yellow-500 mx-auto mb-2" size={32} />
              <h3 className="text-3xl font-black text-yellow-400">${(prizeAmount / 100).toFixed(2)}</h3>
              <p className="text-sm text-zinc-400">Winner Prize (15%)</p>
            </div>
            <div className="text-center">
              <Users className="text-blue-500 mx-auto mb-2" size={32} />
              <h3 className="text-3xl font-black text-blue-400">{submissions.length}</h3>
              <p className="text-sm text-zinc-400">Submissions</p>
            </div>
            <div className="text-center">
              <Calendar className="text-red-500 mx-auto mb-2" size={32} />
              <h3 className="text-2xl font-black text-red-400">Dec 23</h3>
              <p className="text-sm text-zinc-400">Deadline</p>
            </div>
          </div>
        </div>

        {/* Contest Info */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black mb-2">First Aktion Hero Contest</h2>
              <p className="text-zinc-300">Theme: <span className="text-green-400 font-bold">"A Christmas Story"</span></p>
              <p className="text-sm text-zinc-500 mt-1">Winner announced: January 1st, 2025</p>
            </div>
            <Link
              href="/contest/rules"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
            >
              View Full Rules
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Submissions ({submissions.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('votes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'votes'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Most Voted
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'recent'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Most Recent
            </button>
          </div>
        </div>

        {/* Submissions Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-500">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="text-zinc-700 mx-auto mb-4" size={80} />
            <h2 className="text-2xl font-bold text-zinc-700 mb-2">No Submissions Yet</h2>
            <p className="text-zinc-500 mb-6">Be the first to submit your action hero scene!</p>
            <Link
              href="/contest"
              className="inline-block px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
            >
              Submit Your Entry
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSubmissions.map((submission, index) => {
              const hasVoted = userVotes.has(submission.id);
              const isTopThree = sortBy === 'votes' && index < 3;

              return (
                <div
                  key={submission.id}
                  className={`bg-zinc-900/50 border rounded-xl overflow-hidden hover:scale-[1.02] transition-all ${
                    isTopThree
                      ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                      : 'border-zinc-800 hover:border-red-600'
                  }`}
                >
                  {/* Ranking Badge */}
                  {isTopThree && (
                    <div className="absolute top-4 left-4 z-10 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center font-black text-black text-lg shadow-lg">
                      {index + 1}
                    </div>
                  )}

                  {/* Video Preview */}
                  <div className="aspect-video bg-zinc-950 relative">
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center group"
                    >
                      <div className="w-16 h-16 bg-red-600 group-hover:bg-red-700 rounded-full flex items-center justify-center transition-colors">
                        <ExternalLink size={28} />
                      </div>
                    </a>
                  </div>

                  {/* Submission Info */}
                  <div className="p-5">
                    <h3 className="font-black text-lg mb-2 text-white">
                      {submission.submission_name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                      <span>{submission.platform}</span>
                      <span>•</span>
                      <span>{submission.duration}s</span>
                      <span>•</span>
                      <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                    </div>

                    {submission.description && (
                      <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                        {submission.description}
                      </p>
                    )}

                    {/* Voting */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleVote(submission.id)}
                        disabled={!user || hasVoted}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                          hasVoted
                            ? 'bg-red-900/50 text-red-400 cursor-not-allowed'
                            : 'bg-zinc-800 hover:bg-red-600 text-white'
                        }`}
                      >
                        <Heart size={18} className={hasVoted ? 'fill-red-400' : ''} />
                        <span>{submission.community_votes} votes</span>
                      </button>

                      <a
                        href={submission.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors flex items-center gap-1"
                      >
                        Watch
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    {!user && (
                      <p className="text-xs text-zinc-600 mt-2 text-center">
                        Sign in to vote
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Winners Section (if contest is completed) */}
        {contest?.status === 'completed' && (
          <div className="mt-12 bg-gradient-to-br from-yellow-900/30 to-red-900/30 border border-yellow-600/50 rounded-xl p-8">
            <h2 className="text-3xl font-black text-center mb-8">
              🏆 WINNERS 🏆
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Staff Pick */}
              <div className="bg-black/40 border border-yellow-600/50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="text-yellow-500" size={24} />
                  <h3 className="text-xl font-bold">Staff Pick</h3>
                </div>
                <p className="text-zinc-400">Winner will be announced January 1st, 2025</p>
              </div>

              {/* Community Pick */}
              <div className="bg-black/40 border border-blue-600/50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="text-blue-500" size={24} />
                  <h3 className="text-xl font-bold">Community Pick</h3>
                </div>
                <p className="text-zinc-400">Winner will be announced January 1st, 2025</p>
              </div>
            </div>
          </div>
        )}

        {/* Discord Widget */}
        <div className="mt-12 max-w-2xl mx-auto">
          <DiscordWidget />
        </div>
      </div>

      <Footer />
    </div>
  );
}
