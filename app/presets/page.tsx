'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, Clock } from 'lucide-react';

export default function PresetsPage() {
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
              <p className="text-xs text-zinc-500">Cinematic action templates</p>
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

      {/* Coming Soon Content */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <Clock size={48} className="text-red-500" />
          </div>

          {/* Title */}
          <h2 className="text-4xl font-black mb-4">
            COMING SOON
          </h2>

          {/* Description */}
          <p className="text-zinc-400 text-lg mb-8">
            We haven't built presets yet. Our library of cinematic action templates is in development.
          </p>

          {/* What's Coming */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left mb-8">
            <h3 className="font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
              <Zap size={16} className="text-yellow-500" />
              WHAT'S COMING
            </h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Pre-built fight move templates (punches, kicks, takedowns)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                One-click generation with your trained characters
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Custom LoRA-powered action sequences
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Community-shared presets marketplace
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
          >
            Use Canvas Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
