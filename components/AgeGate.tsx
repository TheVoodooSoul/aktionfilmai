'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle, Check } from 'lucide-react';

interface AgeGateProps {
  onVerified: () => void;
  onCancel: () => void;
}

export default function AgeGate({ onVerified, onCancel }: AgeGateProps) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const canProceed = ageConfirmed && tosAccepted && privacyAccepted;

  const handleProceed = () => {
    if (canProceed) {
      // Store verification in localStorage
      localStorage.setItem('aktionfilm_age_verified', 'true');
      localStorage.setItem('aktionfilm_tos_accepted', new Date().toISOString());
      onVerified();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-red-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="text-white" size={28} />
            <div>
              <h2 className="text-xl font-black text-white">AGE VERIFICATION REQUIRED</h2>
              <p className="text-red-200 text-sm">You must be 18 or older to enter</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-200">
              <p className="font-bold mb-1">Content Warning</p>
              <p className="text-yellow-300/80">
                AktionFilm AI contains AI-generated action and combat content including
                simulated violence, fight sequences, and mature themes intended for adult audiences.
              </p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            {/* Age Confirmation */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                ageConfirmed
                  ? 'bg-red-600 border-red-600'
                  : 'border-zinc-600 group-hover:border-zinc-500'
              }`}>
                {ageConfirmed && <Check size={16} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-zinc-300">
                <strong className="text-white">I confirm I am 18 years of age or older</strong> and am legally permitted to view adult content in my jurisdiction.
              </span>
            </label>

            {/* Terms of Service */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                tosAccepted
                  ? 'bg-red-600 border-red-600'
                  : 'border-zinc-600 group-hover:border-zinc-500'
              }`}>
                {tosAccepted && <Check size={16} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-zinc-300">
                I have read and agree to the{' '}
                <Link href="/legal/terms" target="_blank" className="text-red-500 hover:text-red-400 underline">
                  Terms of Service
                </Link>
              </span>
            </label>

            {/* Privacy Policy */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                privacyAccepted
                  ? 'bg-red-600 border-red-600'
                  : 'border-zinc-600 group-hover:border-zinc-500'
              }`}>
                {privacyAccepted && <Check size={16} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="sr-only"
              />
              <span className="text-sm text-zinc-300">
                I have read and agree to the{' '}
                <Link href="/legal/privacy" target="_blank" className="text-red-500 hover:text-red-400 underline">
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link href="/legal/cookies" target="_blank" className="text-red-500 hover:text-red-400 underline">
                  Cookie Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold text-sm transition-colors"
            >
              EXIT
            </button>
            <button
              onClick={handleProceed}
              disabled={!canProceed}
              className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                canProceed
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transform hover:scale-[1.02]'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              ENTER SITE
            </button>
          </div>

          {/* Footer text */}
          <p className="text-xs text-zinc-600 text-center">
            By entering, you acknowledge that you are accessing content intended for adults
            and agree to use the platform responsibly.
          </p>
        </div>
      </div>
    </div>
  );
}
