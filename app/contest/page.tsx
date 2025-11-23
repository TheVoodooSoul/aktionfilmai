'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Send, DollarSign, Calendar, Film, ExternalLink } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Footer from '@/components/Footer';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function SubmissionForm({ contestId, userId, userEmail }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/contest/success`,
        },
      });

      if (error) {
        setMessage(error.message || 'Payment failed');
      }
    } catch (err: any) {
      setMessage('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {message && (
        <div className="p-4 bg-red-900/20 border border-red-600/50 rounded-lg text-red-300 text-sm">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-colors"
      >
        {isSubmitting ? 'Processing...' : 'Complete Submission'}
      </button>
    </form>
  );
}

export default function ContestSubmitPage() {
  const [user, setUser] = useState<any>(null);
  const [contest, setContest] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [submissionData, setSubmissionData] = useState({
    submissionName: '',
    videoUrl: '',
    platform: 'youtube',
    description: '',
    duration: 0,
  });
  const [amount, setAmount] = useState(0);
  const [isFirstSubmission, setIsFirstSubmission] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = form, 2 = payment

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Load active contest
    loadContest();
  }, []);

  const loadContest = async () => {
    try {
      const response = await fetch('/api/contest/submissions?contestId=first-christmas-2024');
      const data = await response.json();
      setContest(data.contest);
    } catch (error) {
      console.error('Failed to load contest:', error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to submit');
      return;
    }

    if (!submissionData.submissionName || !submissionData.videoUrl) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/contest/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId: 'first-christmas-2024',
          userId: user.id,
          userEmail: user.email,
          userName: user.username || user.email,
          ...submissionData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setIsFirstSubmission(data.isFirstSubmission);
        setStep(2);
      } else {
        alert(data.error || 'Failed to create submission');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to create submission');
    } finally {
      setIsLoading(false);
    }
  };

  const options = clientSecret ? { clientSecret } : undefined;

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
              SUBMIT YOUR ENTRY
            </h1>
          </div>
          <Link
            href="/contest/rules"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            View Rules
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        {/* Contest Info */}
        <div className="bg-gradient-to-br from-red-900/30 to-green-900/30 border border-red-600/50 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Trophy className="text-red-500 flex-shrink-0" size={40} />
            <div>
              <h2 className="text-2xl font-black mb-2">First Aktion Hero Contest</h2>
              <p className="text-zinc-300 mb-2">Theme: <span className="text-green-400 font-bold">"A Christmas Story"</span></p>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Deadline: Dec 23, 2024
                </span>
                <span className="flex items-center gap-1">
                  <Film size={16} />
                  1-3 minutes
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={16} />
                  ${isFirstSubmission ? '10' : '5'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-red-500' : 'text-zinc-600'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step === 1 ? 'border-red-500 bg-red-500/20' : 'border-zinc-600'}`}>
              1
            </div>
            <span className="text-sm font-medium">Details</span>
          </div>
          <div className="w-16 h-0.5 bg-zinc-700" />
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-red-500' : 'text-zinc-600'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${step === 2 ? 'border-red-500 bg-red-500/20' : 'border-zinc-600'}`}>
              2
            </div>
            <span className="text-sm font-medium">Payment</span>
          </div>
        </div>

        {/* Form or Payment */}
        {step === 1 ? (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
              {/* Submission Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Submission Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={submissionData.submissionName}
                  onChange={(e) => setSubmissionData({ ...submissionData, submissionName: e.target.value })}
                  placeholder="e.g., 'Santa's Last Stand'"
                  required
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={submissionData.videoUrl}
                  onChange={(e) => setSubmissionData({ ...submissionData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Post your video on YouTube, Instagram, TikTok, or X and paste the link here
                </p>
              </div>

              {/* Platform */}
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={submissionData.platform}
                  onChange={(e) => setSubmissionData({ ...submissionData, platform: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                >
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={submissionData.description}
                  onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
                  placeholder="Tell us about your action sequence..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-600 resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={submissionData.duration}
                  onChange={(e) => setSubmissionData({ ...submissionData, duration: parseInt(e.target.value) })}
                  placeholder="90"
                  min="60"
                  max="180"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                />
                <p className="text-xs text-zinc-500 mt-1">Must be between 1-3 minutes (60-180 seconds)</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
              <h3 className="font-bold text-yellow-400 mb-2">Before Submitting:</h3>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>✓ Video is posted publicly on social media</li>
                <li>✓ Tagged @AktionFilmAI in the post</li>
                <li>✓ Duration is 1-3 minutes</li>
                <li>✓ Content is original and legal</li>
                <li>✓ Follows contest theme: "A Christmas Story"</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || !user}
              className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing...' : (
                <>
                  Continue to Payment
                  <Send size={20} />
                </>
              )}
            </button>

            {!user && (
              <p className="text-center text-sm text-zinc-500">
                Please <Link href="/" className="text-red-500 hover:underline">sign in</Link> to submit
              </p>
            )}
          </form>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Complete Payment</h3>
              <p className="text-zinc-400 text-sm mb-4">
                {isFirstSubmission ? 'First submission' : 'Additional submission'}: <span className="font-bold text-white">${(amount / 100).toFixed(2)}</span>
              </p>
            </div>

            {options && (
              <Elements stripe={stripePromise} options={options}>
                <SubmissionForm
                  contestId="first-christmas-2024"
                  userId={user?.id}
                  userEmail={user?.email}
                />
              </Elements>
            )}

            <button
              onClick={() => setStep(1)}
              className="w-full mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
            >
              ← Back to Edit
            </button>
          </div>
        )}

        {/* Help Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-zinc-500">
          <Link href="/contest/rules" className="hover:text-white transition-colors flex items-center gap-1">
            View Full Rules
            <ExternalLink size={14} />
          </Link>
          <Link href="/contest/vote" className="hover:text-white transition-colors flex items-center gap-1">
            View Submissions
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
