'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Zap, Users, Trophy, ChevronRight, Clapperboard, Volume2, VolumeX } from 'lucide-react';
import Footer from '@/components/Footer';
import AgeGate from '@/components/AgeGate';

const features = [
  {
    icon: Film,
    title: 'Infinite Canvas Storyboarding',
    description: 'Sketch action sequences with our revolutionary node-based canvas system',
    ready: true,
  },
  {
    icon: Clapperboard,
    title: 'Fight Presets',
    description: 'Cinematic fight move templates - pick a preset, load your character, generate',
    ready: false,
    comingSoon: true,
    link: '/presets',
  },
  {
    icon: Zap,
    title: 'Combat Choreography',
    description: 'Transform sketches into cinematic action with dzine i2i technology',
    ready: false,
  },
  {
    icon: Users,
    title: 'Writers Room AI',
    description: 'Script writing assistant with AI improv and character dialogue',
    ready: true,
    link: '/writers-room',
  },
  {
    icon: Trophy,
    title: 'First Aktion Hero Contest',
    description: 'Monthly competition with cash prizes and free subscriptions',
    ready: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle Enter button click - show age gate if not verified
  const handleEnterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const isVerified = localStorage.getItem('aktionfilm_age_verified') === 'true';
    if (isVerified) {
      router.push('/login');
    } else {
      setShowAgeGate(true);
    }
  };

  // Handle age verification complete
  const handleAgeVerified = () => {
    setShowAgeGate(false);
    router.push('/login');
  };

  // Rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle audio playback
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setIsMuted(!isMuted);
    }
  };

  // Try to autoplay on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.volume = 0.3;
        audioRef.current.loop = true;
      }
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [isPlaying]);

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
        // Show consent preferences first
        setShowConsent(true);
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
    setShowConsent(false);
  };

  const handleConsentComplete = () => {
    setShowConsent(false);
    setShowModal(true);
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Age Gate Modal */}
      {showAgeGate && (
        <AgeGate
          onVerified={handleAgeVerified}
          onCancel={() => setShowAgeGate(false)}
        />
      )}

      {/* Login Button - Fixed Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={handleEnterClick}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg font-black text-sm tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-red-600/50 flex items-center gap-2"
        >
          ENTER
          <ChevronRight size={16} />
        </button>
      </div>

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
                <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
                  <feature.icon className="text-red-500" size={32} />
                  <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                  {!feature.ready && (
                    <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500 rounded text-xs font-bold text-yellow-500">
                      UNDER CONSTRUCTION
                    </span>
                  )}
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-20 max-w-7xl">
          {features.map((feature, index) => {
            const featureLink = (feature as any).link;
            const cardClassName = `relative p-6 bg-black/30 border rounded-lg backdrop-blur-sm transition-all group ${
              (feature as any).comingSoon
                ? 'border-red-600/50 hover:border-red-500 bg-gradient-to-br from-red-950/30 to-black/50'
                : 'border-zinc-800 hover:border-red-600'
            }`;

            const cardContent = (
              <>
                {/* Coming Soon Banner - Red diagonal */}
                {(feature as any).comingSoon && (
                  <div className="absolute -top-1 -right-1 overflow-hidden w-24 h-24 pointer-events-none">
                    <div className="absolute top-4 -right-8 w-32 bg-red-600 text-white text-[10px] font-black py-1 text-center transform rotate-45 shadow-lg">
                      COMING SOON
                    </div>
                  </div>
                )}

                {/* Under Construction Badge */}
                {!feature.ready && !(feature as any).comingSoon && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500 rounded text-[10px] font-bold text-yellow-500">
                    UNDER CONSTRUCTION
                  </div>
                )}

                <feature.icon className={`mb-3 group-hover:scale-110 transition-transform ${
                  (feature as any).comingSoon ? 'text-red-400' : 'text-red-500'
                }`} size={28} />
                <h4 className="font-bold mb-2 text-sm">{feature.title}</h4>
                <p className="text-xs text-zinc-500">{feature.description}</p>

                {/* Movie poster style tagline for presets */}
                {(feature as any).comingSoon && (
                  <div className="mt-3 pt-3 border-t border-red-900/50">
                    <p className="text-[10px] text-red-400 font-medium tracking-wide">
                      PUNCHES • KICKS • TAKEDOWNS • COMBOS
                    </p>
                  </div>
                )}
              </>
            );

            return featureLink ? (
              <Link key={index} href={featureLink} className={cardClassName}>
                {cardContent}
              </Link>
            ) : (
              <div key={index} className={cardClassName}>
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Discord Link */}
        <div className="mt-20 max-w-2xl mx-auto text-center">
          <a
            href="https://discord.gg/your-invite-code"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-16 h-16 bg-[#5865F2] hover:bg-[#4752C4] rounded-full transition-all transform hover:scale-110 shadow-lg shadow-[#5865F2]/50"
            aria-label="Join our Discord"
          >
            <svg width="32" height="32" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="white"/>
            </svg>
          </a>
          <p className="mt-4 text-sm text-zinc-500">Join our Discord community</p>
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

      {/* Consent Preferences Modal */}
      {showConsent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4">
            <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-8 border border-zinc-800">
              <h2 className="text-3xl font-black text-white mb-4">
                Privacy & Consent Preferences
              </h2>
              <p className="text-zinc-300 mb-6">
                Before we continue, please review and set your privacy preferences.
              </p>

              {/* Termly Consent Widget */}
              <div className="bg-black/50 rounded-lg p-6 mb-6 border border-zinc-700">
                <p className="text-zinc-400 text-sm mb-4">
                  We use cookies and similar technologies to help personalize content and offer a better experience.
                  You can manage your preferences below.
                </p>
                <div className="flex items-center justify-center">
                  <a
                    href="#"
                    className="termly-display-preferences px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block"
                  >
                    Manage Cookie Preferences
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleConsentComplete}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Continue to Presentation
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                >
                  Skip for Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <Footer />
    </div>
  );
}
