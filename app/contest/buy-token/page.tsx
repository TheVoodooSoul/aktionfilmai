'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ticket, Vote, Film } from 'lucide-react';
import Link from 'next/link';
import DiscordWidget from '@/components/DiscordWidget';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function TokenPurchaseForm({ contestId }: { contestId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm token payment with backend
        const response = await fetch('/api/contest/confirm-token-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        const data = await response.json();

        if (data.success) {
          router.push(`/contest/buy-token/success?tokenId=${data.token.id}`);
        } else {
          setError('Failed to generate token. Please contact support.');
          setProcessing(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200"
      >
        {processing ? 'Processing...' : 'Purchase Token'}
      </button>
    </form>
  );
}

export default function BuyTokenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [isFirstPurchase, setIsFirstPurchase] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [contestId, setContestId] = useState<string>('');
  const [contest, setContest] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/contest/buy-token');
      return;
    }

    // Fetch active contest
    fetch('/api/contest/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.contest) {
          setContestId(data.contest.id);
          setContest(data.contest);
          return initializePayment(data.contest.id);
        }
      })
      .catch((error) => {
        console.error('Error fetching contest:', error);
        setLoading(false);
      });
  }, [user, router]);

  const initializePayment = async (contestId: string) => {
    try {
      const response = await fetch('/api/contest/purchase-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestId,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setIsFirstPurchase(data.isFirstPurchase);
      }
    } catch (error) {
      console.error('Error initializing payment:', error);
    } finally {
      setLoading(false);
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

  if (!contest) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/contest"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Contest
          </Link>
          <div className="text-center p-12 bg-zinc-900 rounded-xl">
            <p className="text-xl text-gray-400">No active contest found</p>
          </div>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret: clientSecret || '',
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#18181b',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
      },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/contest"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Contest
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Purchase Submission Token
              </h1>
              <p className="text-gray-400 text-lg">
                Get your token to submit your entry and cast your votes for {contest.name}
              </p>
            </div>

            {/* Pricing Info */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {isFirstPurchase ? 'First Token' : 'Additional Token'}
                </h2>
                <span className="text-3xl font-bold text-blue-400">
                  ${amount ? (amount / 100).toFixed(2) : '0.00'}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {isFirstPurchase
                  ? 'Your first submission token is $10'
                  : 'Additional tokens are $5 each'}
              </p>
            </div>

            {/* What You Get */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-blue-400" />
                What You Get
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Film className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">1 Submission</p>
                    <p className="text-sm text-gray-400">
                      Submit your video entry to the contest
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Vote className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold">3 Votes</p>
                    <p className="text-sm text-gray-400">
                      Vote for your favorite submissions (including your own!)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contest Info */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold mb-2">{contest.name}</h3>
              <p className="text-gray-400 mb-4">{contest.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Theme</p>
                  <p className="text-white font-semibold">{contest.theme}</p>
                </div>
                <div>
                  <p className="text-gray-500">Deadline</p>
                  <p className="text-white font-semibold">
                    {new Date(contest.submission_deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Discord Widget */}
            <DiscordWidget />
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
              <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={options}>
                  <TokenPurchaseForm contestId={contestId} />
                </Elements>
              ) : (
                <div className="text-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-gray-400">Initializing payment...</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> Your token will be generated immediately after payment. Use it to submit your entry and vote on submissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
