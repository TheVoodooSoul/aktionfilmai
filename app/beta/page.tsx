'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, Check, Loader2, AlertTriangle, MessageCircle } from 'lucide-react';

const BETA_TIERS = [
  {
    id: 'starter',
    name: 'Beta Starter',
    price: 29,
    credits: 500,
    features: [
      '500 credits to start',
      'Full canvas access',
      'AI video generation',
      'Writers Room access',
      'Community Discord access',
    ],
  },
  {
    id: 'plus',
    name: 'Beta Plus',
    price: 40,
    credits: 1400,
    popular: true,
    features: [
      '1,400 credits to start',
      'Everything in Starter',
      'Priority generation queue',
      'Character training (3 avatars)',
      'Early access to new features',
      'Direct feedback channel',
    ],
  },
];

const EXPERIENCE_OPTIONS = [
  'Professional filmmaker',
  'Indie creator / YouTuber',
  'Hobbyist / Enthusiast',
  'Student',
  'Just curious',
];

const INTEREST_OPTIONS = [
  'Action/Fight sequences',
  'Storyboarding',
  'Character animation',
  'AI video generation',
  'Script writing / Writers Room',
  'All of the above',
];

const DISCOVERY_OPTIONS = [
  'Twitter/X',
  'Discord',
  'YouTube',
  'Reddit',
  'Friend referral',
  'Search engine',
  'Other',
];

export default function BetaPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form data
  const [email, setEmail] = useState('');
  const [experience, setExperience] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [discovery, setDiscovery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [wantsAnnual, setWantsAnnual] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          experience,
          interests,
          discovery,
          selectedTier,
          wantsAnnual,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Beta signup error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return true; // Just reading the letter
    if (step === 2) return email.includes('@');
    if (step === 3) return experience && interests.length > 0 && discovery;
    if (step === 4) return selectedTier;
    return false;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} />
          </div>
          <h1 className="text-4xl font-black mb-4">YOU'RE ON THE LIST</h1>
          <p className="text-zinc-400 text-lg mb-6">
            We're letting people in gradually over the next 1-2 weeks.
            Keep an eye on your inbox - we'll reach out soon with your access details.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <p className="text-sm text-zinc-500 mb-2">Your selected tier:</p>
            <p className="text-2xl font-bold text-red-500">
              {BETA_TIERS.find(t => t.id === selectedTier)?.name}
            </p>
            {wantsAnnual && (
              <p className="text-green-500 text-sm mt-2">+ 20% annual discount locked in</p>
            )}
          </div>
          <a
            href="https://discord.gg/aktionfilmai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg font-bold transition-colors mb-4"
          >
            <MessageCircle size={20} />
            Join Discord for Updates
          </a>
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <div
                  key={s}
                  className={`w-6 h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-red-600' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500 ml-2">Step {step}/4</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step 1: Letter */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 mb-8">
                <h1 className="text-3xl font-black mb-6 text-red-500">
                  WELCOME TO THE AKTIONFILMAI BETA
                </h1>

                <div className="space-y-4 text-zinc-300 leading-relaxed">
                  <p>
                    Thanks for your interest in the AktionFilmAI beta—built for AI filmmakers and creators
                    who want action-forward visuals without the endless scavenger hunt.
                  </p>
                  <p>
                    This beta is <strong className="text-white">invite-based</strong> while we stabilize the platform.
                    Your feedback will directly shape what we build next.
                  </p>

                  {/* Use Guidelines */}
                  <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4 my-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={20} />
                      <div>
                        <h3 className="font-bold text-yellow-500 mb-2">Use Guidelines (Read Carefully)</h3>
                        <p className="text-sm text-yellow-200/80 mb-3">
                          A few bad choices can get the whole party shut down, so we run a tight ship:
                        </p>
                        <ul className="space-y-2 text-sm text-zinc-400">
                          <li>• <strong className="text-zinc-300">No real people or public officials</strong> without explicit permission (including lookalikes).</li>
                          <li>• <strong className="text-zinc-300">No minors</strong> in any sexual, nude, exploitative, or "suggestive" context—ever. Violations may be reported and will result in an immediate ban.</li>
                          <li>• <strong className="text-zinc-300">No hate content:</strong> racism, sexism, bigotry, or extremist promotion.</li>
                          <li>• <strong className="text-zinc-300">No glorification of real-world violence.</strong> This tool is for story-driven, purpose-based action that serves a script—not cruelty for clicks.</li>
                          <li>• When sharing action content publicly, use warnings and post only in communities where it belongs.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* What's Live */}
                  <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4">
                    <h3 className="font-bold text-green-500 mb-2">What's Live Right Now</h3>
                    <ul className="space-y-1 text-sm text-zinc-400">
                      <li>• <strong className="text-zinc-300">Canva-style node generator</strong></li>
                      <li>• <strong className="text-zinc-300">Writer's Room:</strong> develop scenes, storyboard, and improv with characters in real time (great for dialogue)</li>
                    </ul>
                  </div>

                  <p className="text-sm text-zinc-500 mt-6">
                    Click continue to answer a short set of questions, and we'll begin inviting users in waves over the next 1–2 weeks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Email */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-black mb-8 text-center">YOUR EMAIL</h2>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="action@filmmaker.com"
                  className="w-full px-4 py-4 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-lg focus:outline-none focus:border-red-600"
                />
                <p className="text-sm text-zinc-500 text-center">
                  We'll use this to send your invite and updates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Questions */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-8 text-center">TELL US ABOUT YOURSELF</h2>

            <div className="space-y-8 max-w-2xl mx-auto">
              {/* Question 1: Experience */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3">
                  What best describes you?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setExperience(opt)}
                      className={`px-4 py-3 rounded-lg text-left transition-all ${
                        experience === opt
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Interests (multi-select) */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3">
                  What features interest you most? (select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTEREST_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleInterest(opt)}
                      className={`px-4 py-3 rounded-lg text-left transition-all flex items-center gap-2 ${
                        interests.includes(opt)
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      {interests.includes(opt) && <Check size={16} />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3: Discovery */}
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3">
                  How did you hear about us?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DISCOVERY_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setDiscovery(opt)}
                      className={`px-4 py-3 rounded-lg text-sm transition-all ${
                        discovery === opt
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Tier Selection */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-black mb-2 text-center">CHOOSE YOUR BETA TIER</h2>
            <p className="text-zinc-500 text-center mb-8">
              Beta pricing is exclusive to early adopters.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
              {BETA_TIERS.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`relative p-6 rounded-xl text-left transition-all ${
                    selectedTier === tier.id
                      ? 'bg-red-600/20 border-2 border-red-600'
                      : 'bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-600 rounded-full text-xs font-bold">
                      BEST VALUE
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={selectedTier === tier.id ? 'text-red-500' : 'text-zinc-500'} size={20} />
                    <span className="font-bold text-lg">{tier.name}</span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black">${tier.price}</span>
                    <span className="text-zinc-500">one-time</span>
                  </div>

                  <div className="text-2xl font-bold text-yellow-500 mb-4">
                    {tier.credits.toLocaleString()} credits
                  </div>

                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                        <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Refill Info */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 max-w-3xl mx-auto mb-6">
              <div className="flex items-center gap-3">
                <Zap className="text-yellow-500" size={20} />
                <div>
                  <p className="font-bold text-sm">Need more credits?</p>
                  <p className="text-xs text-zinc-500">
                    Credit refills available during beta
                  </p>
                </div>
              </div>
            </div>

            {/* Annual Upsell */}
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setWantsAnnual(!wantsAnnual)}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  wantsAnnual
                    ? 'bg-green-600/20 border-green-600'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    wantsAnnual ? 'bg-green-600 border-green-600' : 'border-zinc-600'
                  }`}>
                    {wantsAnnual && <Check size={12} />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold">Lock in 20% off annual membership</p>
                    <p className="text-sm text-zinc-500">
                      Annual memberships are 20% off during the beta period
                    </p>
                  </div>
                </div>
                <span className="text-green-500 font-bold text-sm">SAVE 20%</span>
              </button>
            </div>

            {/* Community note */}
            <div className="max-w-3xl mx-auto mt-6 text-center">
              <p className="text-sm text-zinc-500">
                Join our <a href="https://discord.gg/aktionfilmai" className="text-red-500 hover:underline">Discord</a> for
                announcements, invites, and giveaways—we'll be doing a lottery-style rollout as we scale access.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 max-w-2xl mx-auto">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-lg font-bold transition-all ${
                canProceed()
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                canProceed() && !isSubmitting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'JOIN THE BETA'
              )}
            </button>
          )}
        </div>

        {/* Signature */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto mt-8 text-center text-sm text-zinc-500">
            <p>Thanks again for your time and interest,</p>
            <p className="font-bold text-zinc-400 mt-1">Adam Watson</p>
            <p>adam@aktionfilmai.com</p>
          </div>
        )}
      </div>
    </div>
  );
}
