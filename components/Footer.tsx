'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black mt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-black text-red-500 mb-3">AKTION FILM AI</h3>
            <p className="text-sm text-zinc-500">
              Choreograph the impossible. Create cinematic action sequences with AI.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/canvas" className="hover:text-white transition-colors">
                  Canvas
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contest" className="hover:text-white transition-colors">
                  Contest
                </Link>
              </li>
              <li>
                <Link href="/writers-room" className="hover:text-white transition-colors">
                  Writers Room
                </Link>
              </li>
            </ul>
          </div>

          {/* Contest */}
          <div>
            <h4 className="font-bold text-white mb-3">Aktion Hero</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/contest/rules" className="hover:text-white transition-colors">
                  Contest Rules
                </Link>
              </li>
              <li>
                <Link href="/contest" className="hover:text-white transition-colors">
                  Submit Entry
                </Link>
              </li>
              <li>
                <Link href="/contest/vote" className="hover:text-white transition-colors">
                  View & Vote
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="termly-display-preferences hover:text-white transition-colors"
                >
                  Manage Cookies
                </a>
              </li>
              <li>
                <a
                  href="https://app.termly.io/policy-viewer/policy.html?policyUUID=55b00b12-62d7-4e11-a1f0-e7d265c9be06"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Consent Preferences
                </a>
              </li>
              <li>
                <a
                  href="https://app.termly.io/policy-viewer/policy.html?policyUUID=b0150c04-65da-4f4a-8ccf-26671d116302"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Do Not Sell My Info
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-600">
            © {new Date().getFullYear()} Aktion Film AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-600">
            <a
              href="https://twitter.com/AktionFilmAI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Twitter/X
            </a>
            <a
              href="https://instagram.com/AktionFilmAI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://youtube.com/@AktionFilmAI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
