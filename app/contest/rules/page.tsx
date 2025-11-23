'use client';

import Link from 'next/link';
import { Trophy, DollarSign, Calendar, Film, Target, Zap } from 'lucide-react';

export default function ContestRulesPage() {
  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-6xl md:text-8xl font-black mb-6"
            style={{
              background: 'linear-gradient(180deg, #DC2626 0%, #EA580C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 80px rgba(220, 38, 38, 0.5)',
            }}
          >
            AKTION HERO
          </h1>
          <h2 className="text-3xl font-bold text-zinc-300 mb-4">
            MONTHLY COMPETITION RULES
          </h2>
          <p className="text-zinc-400 text-lg">
            Welcome, adrenaline junkies. Make Michael Bay look like he's directing a middle-school bake sale.
          </p>
        </div>

        {/* Main Rules Content */}
        <div className="space-y-8">
          {/* Prizes Section */}
          <section className="bg-zinc-900/50 border border-red-600/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-red-500" size={32} />
              <h2 className="text-3xl font-black">THE PRIZES</h2>
            </div>
            <p className="text-zinc-300 mb-4">
              We're keeping it indie, gritty, and transparent:
            </p>
            <ul className="space-y-3 text-zinc-300">
              <li className="flex items-start gap-3">
                <DollarSign className="text-green-500 flex-shrink-0 mt-1" size={20} />
                <span>
                  <strong className="text-white">15% of the buy-in pot</strong> — We show the numbers. No shady Hollywood accounting.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Trophy className="text-yellow-500 flex-shrink-0 mt-1" size={20} />
                <span>
                  <strong className="text-white">An AktionFilmAI Hat</strong> — Consider it your ceremonial crown of chaos.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="text-purple-500 flex-shrink-0 mt-1" size={20} />
                <span>
                  <strong className="text-white">Free month of AktionFilmAI Pro</strong> — Keep leveling up your cinematic carnage.
                </span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
              <p className="text-sm text-red-300">
                <strong>Two winners every month:</strong> Staff Pick and Community Pick
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                Each month we spotlight a new archetype: The Bringer of Chaos, Femme Fatale, Rogue Stunt Poet — we're cycling through them as we grow.
              </p>
            </div>
          </section>

          {/* This Month's Theme */}
          <section className="bg-gradient-to-br from-green-900/30 to-red-900/30 border border-green-600/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-green-500" size={32} />
              <h2 className="text-3xl font-black">THIS MONTH: "A CHRISTMAS STORY"</h2>
            </div>
            <p className="text-zinc-300 mb-4">
              Interpret it however you please:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-300">
              <li>• Violent gingerbread revenge saga</li>
              <li>• Santa's last stand</li>
              <li>• Elf noir</li>
              <li>• Die Hard with lightsabers</li>
              <li>• Holiday apocalypse choreography</li>
              <li>• Christmas chaos of your choice</li>
            </ul>
            <p className="text-zinc-400 mt-4 text-sm">
              Style, originality, genre homage, dialogue, pacing, and action all count. <strong className="text-red-400">Tasteful insanity is encouraged.</strong>
            </p>
          </section>

          {/* Entry Details */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="text-green-500" size={32} />
              <h2 className="text-3xl font-black">ENTRY FEES</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-900/20 border border-green-600/50 rounded-lg">
                <p className="text-2xl font-black text-green-400 mb-1">$10</p>
                <p className="text-sm text-zinc-400">First submission</p>
              </div>
              <div className="p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
                <p className="text-2xl font-black text-blue-400 mb-1">$5</p>
                <p className="text-sm text-zinc-400">Additional submissions</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              <strong className="text-zinc-400">Why?</strong> Because AktionFilmAI is running on a hilariously tiny budget, and this keeps the lights on while building the community. We're transparent. We'll be reasonable with refunds. Everything goes into the monthly pot + platform growth.
            </p>
          </section>

          {/* Deadlines */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-blue-500" size={32} />
              <h2 className="text-3xl font-black">DEADLINES</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                <span className="text-zinc-300">Submit by:</span>
                <span className="font-bold text-white">December 23rd, 2024</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg">
                <span className="text-zinc-300">Winners announced:</span>
                <span className="font-bold text-white">January 1st, 2025</span>
              </div>
            </div>
          </section>

          {/* Year-End Showdown */}
          <section className="bg-gradient-to-br from-purple-900/30 to-red-900/30 border border-purple-600/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-purple-500" size={32} />
              <h2 className="text-3xl font-black">THE YEAR-END SHOWDOWN</h2>
            </div>
            <p className="text-zinc-300 mb-4">
              At the end of the year, all monthly winners (12-24 total) collide in a final duel for the highest honor:
            </p>
            <div className="text-center py-6">
              <h3 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 mb-2">
                ⭐ THE ARNAHLD STALLONE ⭐
              </h3>
              <p className="text-zinc-400 italic">Think Highlander: There can be only one.</p>
            </div>
            <p className="text-xs text-zinc-500 text-center">
              More details soon as we build toward this madness.
            </p>
          </section>

          {/* How to Submit */}
          <section className="bg-zinc-900/50 border border-red-600/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Film className="text-red-500" size={32} />
              <h2 className="text-3xl font-black">HOW TO SUBMIT</h2>
            </div>
            <ol className="space-y-4 text-zinc-300">
              <li className="flex gap-3">
                <span className="font-black text-red-500 flex-shrink-0">1.</span>
                <span>Create your 1-3 minute action short.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-black text-red-500 flex-shrink-0">2.</span>
                <span>Post it on social media (YouTube, IG, TikTok, X — your choice).</span>
              </li>
              <li className="flex gap-3">
                <span className="font-black text-red-500 flex-shrink-0">3.</span>
                <span>Tag <strong className="text-white">@AktionFilmAI</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="font-black text-red-500 flex-shrink-0">4.</span>
                <span>Include your submission name in the caption.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-black text-red-500 flex-shrink-0">5.</span>
                <span>Submit the link via our submission form.</span>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
              <p className="text-sm text-yellow-300">
                <strong>Important:</strong> Keep it classy. Keep it original. Keep it legal. Show us what you've got.
              </p>
            </div>
          </section>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Link
              href="/contest"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-black text-center transition-all transform hover:scale-105"
            >
              SUBMIT YOUR ENTRY
            </Link>
            <Link
              href="/contest/vote"
              className="flex-1 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-black text-center transition-all"
            >
              VIEW SUBMISSIONS & VOTE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
