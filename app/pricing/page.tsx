'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import Footer from '@/components/Footer';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const pricingTiers = [
  {
    name: 'Beta Access',
    monthlyPrice: 20,
    annualPrice: 20,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_BETA_MONTHLY || 'price_beta_monthly',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_BETA_ANNUAL || 'price_beta_annual',
    },
    credits: 500,
    icon: Zap,
    color: 'from-green-600 to-green-700',
    badge: 'EARLY ACCESS',
    features: [
      '500 credits/month',
      'Early access to features',
      'Sketch-to-image generation',
      'Basic character creation',
      'Community support',
      'HD output quality',
    ],
  },
  {
    name: 'Hobbyist',
    monthlyPrice: 10,
    annualPrice: 9,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBYIST_MONTHLY || 'price_hobbyist_monthly',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_HOBBYIST || 'price_hobbyist',
    },
    credits: 100,
    icon: Zap,
    color: 'from-blue-600 to-blue-700',
    features: [
      '100 credits/month',
      'Sketch-to-image generation',
      'Basic character creation',
      'Community support',
      'HD output quality',
    ],
  },
  {
    name: 'Indie',
    monthlyPrice: 49.99,
    annualPrice: 29,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIE_MONTHLY || 'price_indie_monthly',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIE || 'price_indie',
    },
    credits: 500,
    icon: Crown,
    color: 'from-purple-600 to-purple-700',
    popular: true,
    features: [
      '500 credits/month',
      'Everything in Hobbyist',
      'Advanced AI models',
      'Priority generation queue',
      '4K output quality',
      'Custom LoRA training',
    ],
  },
  {
    name: 'Pro',
    monthlyPrice: 149.99,
    annualPrice: 99,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro',
    },
    credits: 2000,
    icon: Rocket,
    color: 'from-red-600 to-red-700',
    features: [
      '2000 credits/month',
      'Everything in Indie',
      'Unlimited character slots',
      'Premium support',
      'Commercial usage rights',
      'API access',
      'Early feature access',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [dataOptIn, setDataOptIn] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [betaDiscount] = useState(0.10); // 10% beta launch discount

  useEffect(() => {
    // Get user from localStorage (or your auth system)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Check data sharing opt-in status
    const checkDataOptIn = async () => {
      if (!storedUser) return;
      const userData = JSON.parse(storedUser);

      try {
        const response = await fetch(`/api/user/data-sharing-status?userId=${userData.id}`);
        if (response.ok) {
          const data = await response.json();
          setDataOptIn(data.opted_in);
        }
      } catch (error) {
        console.error('Failed to check opt-in status:', error);
      }
    };

    checkDataOptIn();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      // Redirect to signup/login
      router.push('/?signup=true');
      return;
    }

    setIsLoading(priceId);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
          dataOptIn,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-purple-900/20" />
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black mb-6"
            style={{
              background: 'linear-gradient(180deg, #DC2626 0%, #7F1D1D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 80px rgba(220, 38, 38, 0.5)',
            }}
          >
            CHOOSE YOUR TIER
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4">
            Unleash cinematic action sequences with AI. All tiers include monthly credit refills.
          </p>
          <div className="inline-block px-6 py-3 bg-green-600/20 border border-green-600/50 rounded-lg">
            <p className="text-green-400 font-bold text-lg">
              🎉 BETA LAUNCH SPECIAL: 10% OFF ALL ANNUAL PLANS
            </p>
          </div>

          {/* Billing Period Toggle */}
          <div className="mt-8 inline-flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">
                SAVE 40%
              </span>
            </button>
          </div>

          {/* Data Sharing Discount Banner */}
          {dataOptIn && (
            <div className="mt-6 inline-block px-6 py-3 bg-green-900/30 border border-green-600/50 rounded-lg">
              <p className="text-green-400 font-bold">
                ✓ 10% Discount Active — Data Sharing Enabled
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;

            // Only show Beta on monthly, hide other monthly plans
            if (billingPeriod === 'monthly' && tier.name !== 'Beta Access') {
              return null;
            }

            const basePrice = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            // Apply beta discount to annual plans, data opt-in discount stacks
            const priceWithBetaDiscount = billingPeriod === 'annual' ? basePrice * (1 - betaDiscount) : basePrice;
            const finalPrice = dataOptIn ? priceWithBetaDiscount * 0.9 : priceWithBetaDiscount;
            const currentPriceId = typeof tier.priceId === 'string' ? tier.priceId : tier.priceId[billingPeriod];

            return (
              <div
                key={tier.name}
                className={`relative bg-zinc-900/50 border-2 rounded-xl p-8 backdrop-blur-sm transition-all hover:scale-105 ${
                  tier.popular
                    ? 'border-red-600 shadow-2xl shadow-red-600/50'
                    : tier.badge
                    ? 'border-green-600 shadow-xl shadow-green-600/30'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}
                {tier.badge && !tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-600 rounded-full text-sm font-bold">
                    {tier.badge}
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-6`}
                >
                  <Icon size={32} className="text-white" />
                </div>

                {/* Tier Name */}
                <h3 className="text-3xl font-black mb-2">{tier.name}</h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">
                      ${finalPrice.toFixed(finalPrice % 1 === 0 ? 0 : 2)}
                    </span>
                    <span className="text-zinc-500">/mo</span>
                  </div>
                  {(dataOptIn || billingPeriod === 'annual') && finalPrice !== basePrice && (
                    <p className="text-sm text-zinc-500 line-through">
                      ${basePrice.toFixed(basePrice % 1 === 0 ? 0 : 2)}/mo
                    </p>
                  )}
                  {billingPeriod === 'annual' && (
                    <p className="text-sm text-green-400 mt-1 font-bold">
                      10% Beta Launch Discount Applied!
                    </p>
                  )}
                  {billingPeriod === 'annual' && tier.monthlyPrice !== tier.annualPrice && (
                    <p className="text-sm text-zinc-400 mt-1">
                      + Save ${((tier.monthlyPrice - tier.annualPrice) * 12).toFixed(0)}/year vs monthly
                    </p>
                  )}
                  <p className="text-zinc-400 mt-2">{tier.credits} credits/month</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(currentPriceId)}
                  disabled={isLoading === currentPriceId}
                  className={`w-full py-4 rounded-lg font-black text-lg transition-all transform hover:scale-105 active:scale-95 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/50'
                      : tier.badge
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/50'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  } ${isLoading === currentPriceId ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isLoading === currentPriceId ? 'LOADING...' : 'SUBSCRIBE NOW'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Data Sharing CTA */}
        {!dataOptIn && user && (
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-600/50 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-black mb-4">Save 10% on All Tiers</h3>
            <p className="text-zinc-300 mb-6">
              Enable data sharing to help train our AI models and unlock a permanent 10% discount on all memberships.
            </p>
            <button
              onClick={() => router.push('/canvas?settings=true')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
            >
              Enable Data Sharing
            </button>
          </div>
        )}

        {/* FAQ / Info */}
        <div className="mt-20 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-6">How Credits Work</h2>
          <div className="space-y-4 text-left bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
            <div>
              <h4 className="font-bold text-white mb-2">💳 Monthly Refills</h4>
              <p className="text-sm text-zinc-400">
                Your monthly credits reset at the start of each billing cycle. Monthly credits expire if unused.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">🎫 Credit Top-Ups (Subscribers Only)</h4>
              <p className="text-sm text-zinc-400">
                Purchase additional credits starting at $20. Top-up credits never expire and stack with your monthly credits!
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">⚡ Credit Costs</h4>
              <p className="text-sm text-zinc-400">
                Sketch-to-image: 1 credit • AI video (5s): 10 credits • Character training: 20 credits
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">🔄 Cancel Anytime</h4>
              <p className="text-sm text-zinc-400">
                No long-term commitment. Cancel your subscription anytime from your account settings.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">📊 Data Sharing Discount</h4>
              <p className="text-sm text-zinc-400">
                Opt in to share your generated outputs and receive 10% off all membership tiers, forever.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
