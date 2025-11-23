'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Film, Zap, Users, Trophy, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Film,
    title: 'Infinite Canvas Storyboarding',
    description: 'Sketch action sequences with our revolutionary node-based canvas system',
  },
  {
    icon: Zap,
    title: 'AI Violence Generation',
    description: 'Transform sketches into cinematic action with dzine i2i technology',
  },
  {
    icon: Users,
    title: 'Writers Room AI',
    description: 'Script writing assistant that learns and improves with your style',
  },
  {
    icon: Trophy,
    title: 'First Aktion Hero Contest',
    description: 'Monthly competition with cash prizes and free subscriptions',
  },
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  // Rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Successfully joined the fight! Check your email.');
        setEmail('');
        // Show the Gamma presentation modal
        setShowModal(true);
      } else {
        setMessage(data.error || 'Failed to sign up');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowThanks(false);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* YouTube Background Video */}
      <div className="absolute inset-0 z-0">
        <iframe
          className="absolute w-full h-full object-cover scale-150"
          src="https://www.youtube.com/embed/fefEZtIHdGE?autoplay=1&mute=1&loop=1&playlist=fefEZtIHdGE&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1"
          title="Background"
          frameBorder="0"
          allow="autoplay; loop"
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      </div>

      {/* Film Grain Texture Overlay */}
      <div className="absolute inset-0 z-10 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
          animation: 'grain 0.5s steps(10) infinite',
        }}
      />

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        {/* Logo/Brand */}
        <div className="mb-8 animate-fade-in">
          <img
            src="/logo.png"
            alt="AktionFilmAI Logo"
            className="w-64 md:w-96 lg:w-[500px] h-auto mx-auto"
          />
        </div>

        {/* Main Title */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-center mb-6 animate-slide-up"
          style={{
            background: 'linear-gradient(180deg, #DC2626 0%, #7F1D1D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 80px rgba(220, 38, 38, 0.5)',
            WebkitTextStroke: '2px rgba(220, 38, 38, 0.3)',
          }}
        >
          AKTION FILM AI
        </h1>

        {/* Tagline */}
        <p className="text-2xl md:text-4xl font-bold text-zinc-300 mb-12 text-center tracking-wider animate-slide-up"
          style={{
            textShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
            animationDelay: '0.2s',
          }}
        >
          CHOREOGRAPH THE IMPOSSIBLE
        </p>

        {/* Rotating Features */}
        <div className="w-full max-w-2xl mb-12 h-32 flex items-center justify-center">
          <div className="text-center space-y-3 animate-fade-in">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  index === currentFeatureIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'
                }`}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <feature.icon className="text-red-500" size={32} />
                  <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                </div>
                <p className="text-zinc-400 text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email Capture Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-8 space-y-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex gap-3 items-stretch">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 min-w-0 px-6 py-3 bg-black/50 border-2 border-red-600/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 backdrop-blur-sm text-base"
              style={{ height: '52px' }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-zinc-800 disabled:to-zinc-900 rounded-lg font-black text-base tracking-wider transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-red-600/50 whitespace-nowrap"
              style={{ height: '52px' }}
            >
              {isSubmitting ? 'JOINING...' : 'JOIN BETA'}
              <ChevronRight />
            </button>
          </div>
          {message && (
            <p className={`text-center text-sm ${message.includes('✓') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </form>

        {/* Beta Access Notice */}
        <div className="text-center animate-slide-up max-w-2xl" style={{ animationDelay: '0.6s' }}>
          <div className="inline-block px-6 py-3 bg-red-600/20 border border-red-600/50 rounded-lg backdrop-blur-sm">
            <p className="text-zinc-300 text-sm">
              🔒 <span className="font-bold text-red-500">BETA ACCESS REQUIRED</span> — We'll send invites this week!
            </p>
          </div>
        </div>

        {/* Feature Grid (Bottom) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-6xl">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-black/30 border border-zinc-800 rounded-lg backdrop-blur-sm hover:border-red-600 transition-all group"
            >
              <feature.icon className="text-red-500 mb-3 group-hover:scale-110 transition-transform" size={28} />
              <h4 className="font-bold mb-2 text-sm">{feature.title}</h4>
              <p className="text-xs text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center text-zinc-600 text-sm">
          <p>© 2024 Aktion Film AI. All rights reserved.</p>
          <p className="mt-2">Unleash your inner action hero.</p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out;
          animation-fill-mode: both;
        }
      `}</style>

      {/* Gamma Presentation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors text-lg font-bold"
            >
              ✕ Close
            </button>

            {/* Presentation */}
            {!showThanks ? (
              <div className="bg-black/50 rounded-xl overflow-hidden border border-zinc-800">
                <iframe
                  src="https://gamma.app/embed/9u1m1kg3obiqz8j"
                  style={{ width: '100%', height: '450px', maxWidth: '700px', margin: '0 auto', display: 'block' }}
                  allow="fullscreen"
                  title="AktionFilmAI"
                  className="rounded-lg"
                />
                <div className="p-6 text-center">
                  <button
                    onClick={() => setShowThanks(true)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                  >
                    I've Watched It
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-red-900/50 to-black/50 rounded-xl p-12 text-center border border-red-600/50">
                <h2 className="text-4xl font-black text-white mb-4">
                  🎬 THANKS FOR JOINING!
                </h2>
                <p className="text-xl text-zinc-300 mb-6">
                  We'll send you a beta invite this week.
                </p>
                <p className="text-zinc-400 mb-8">
                  Get ready to choreograph the impossible.
                </p>
                <button
                  onClick={handleCloseModal}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all hover:scale-105"
                >
                  CLOSE
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
