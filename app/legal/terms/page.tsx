'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Terms of Service</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
          <iframe
            src="https://app.termly.io/policy-viewer/policy.html?policyUUID=9a874d9c-53ac-4c56-83f6-981cecc6440c"
            style={{ width: '100%', minHeight: '800px', border: 'none' }}
            title="Terms of Service"
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
