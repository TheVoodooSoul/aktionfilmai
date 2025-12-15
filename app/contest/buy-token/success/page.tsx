'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';
import { CheckCircle, Copy, Ticket, Vote, Film, ArrowRight } from 'lucide-react';
import DiscordWidget from '@/components/DiscordWidget';

function TokenPurchaseSuccessContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenId = searchParams.get('tokenId');

  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!tokenId) {
      router.push('/contest');
      return;
    }

    // Fetch token details
    fetch(`/api/contest/token?tokenId=${tokenId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        }
      })
      .catch((error) => {
        console.error('Error fetching token:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, tokenId, router]);

  const copyTokenCode = () => {
    if (token?.token_code) {
      navigator.clipboard.writeText(token.token_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-gray-400 mb-8">Token not found</p>
          <Link
            href="/contest"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Contest
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-600 bg-clip-text text-transparent">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-400">
            Your submission token has been generated
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Token Details */}
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl p-8 border border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <Ticket className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl font-bold">Your Token</h2>
            </div>

            <div className="bg-black/50 rounded-lg p-6 mb-6 border border-zinc-700">
              <p className="text-sm text-gray-400 mb-2">Token Code</p>
              <div className="flex items-center justify-between gap-4">
                <code className="text-2xl font-mono font-bold text-blue-400">
                  {token.token_code}
                </code>
                <button
                  onClick={copyTokenCode}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  title="Copy token code"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-400 mt-2">Copied to clipboard!</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-3">
                  <Film className="w-6 h-6 text-purple-400" />
                  <span className="font-semibold">Submissions Available</span>
                </div>
                <span className="text-2xl font-bold text-purple-400">
                  {token.submission_allowance}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-3">
                  <Vote className="w-6 h-6 text-green-400" />
                  <span className="font-semibold">Votes Remaining</span>
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {token.votes_remaining}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                Keep this token code safe! You'll need it to submit your entry and cast your votes.
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
              <h2 className="text-2xl font-bold mb-6">What's Next?</h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Submit Your Entry</h3>
                    <p className="text-gray-400 mb-4">
                      Use your token to submit your video entry to the contest. Make it count!
                    </p>
                    <Link
                      href="/contest"
                      className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Submit Entry
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="h-px bg-zinc-800"></div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Vote on Submissions</h3>
                    <p className="text-gray-400 mb-4">
                      Browse other entries and use your 3 votes to support your favorites (you can vote for yourself too!).
                    </p>
                    <Link
                      href="/contest/vote"
                      className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      View Submissions
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="h-px bg-zinc-800"></div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Join the Community</h3>
                    <p className="text-gray-400">
                      Connect with other filmmakers, share tips, and stay updated on contest announcements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-2">Need Another Token?</h3>
              <p className="text-gray-400 mb-4">
                Want to submit multiple entries? Additional tokens are only $5 each.
              </p>
              <Link
                href="/contest/buy-token"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
              >
                Purchase Another Token
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Discord Widget */}
        <div className="max-w-4xl mx-auto">
          <DiscordWidget />
        </div>
      </div>
    </div>
  );
}

export default function TokenPurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <TokenPurchaseSuccessContent />
    </Suspense>
  );
}
