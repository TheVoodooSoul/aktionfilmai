'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Home, Save, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, setUser } = useStore();
  const [trainingOptIn, setTrainingOptIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testUserId, setTestUserId] = useState('');

  // Auto-login super admin
  useEffect(() => {
    if (!user) {
      // Check localStorage first
      const storedUser = localStorage.getItem('aktionfilm_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Auto-create super admin with valid UUID
        const superAdmin = {
          id: '00000000-0000-0000-0000-000000000001', // Valid UUID for super admin
          email: 'adam@egopandacreative.com',
          username: 'ArnoldStallone82',
          pin: '4313',
          role: 'superadmin',
        };
        setUser(superAdmin);
        localStorage.setItem('aktionfilm_user', JSON.stringify(superAdmin));
      }
    }
  }, [user, setUser]);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('training_opt_in')
        .eq('id', user.id)
        .single();

      if (data) {
        setTrainingOptIn(data.training_opt_in || false);
      }
    };
    loadSettings();
  }, [user]);

  // Create test user for development
  const createTestUser = () => {
    const userId = testUserId || 'test-user-' + Date.now();
    const email = testEmail || 'test@aktionfilm.ai';

    setUser({
      id: userId,
      email: email,
    });

    setSaveMessage('Test user created! You can now use the app.');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            training_opt_in: trainingOptIn,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            training_opt_in: trainingOptIn,
            credits: 1000, // Give test credits
          });

        if (error) throw error;
      }

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Failed to save settings. Error: ' + (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[#0a0a0a] border-b border-zinc-900 z-40 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              <Home size={20} />
            </Link>
            <h1 className="text-lg font-bold text-white">Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Test User Creation (Development Only) */}
          {!user && (
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 text-yellow-500">Development Mode - Create Test User</h2>
              <p className="text-zinc-400 text-sm mb-4">
                Authentication not set up yet. Create a test user to try the features.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Email (optional)</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@aktionfilm.ai"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-600"
                  />
                </div>

                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">User ID (optional)</label>
                  <input
                    type="text"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-600"
                  />
                </div>

                <button
                  onClick={createTestUser}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-medium rounded-lg transition-colors"
                >
                  Create Test User
                </button>
              </div>
            </div>
          )}

          {/* Profile Section */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-2">Profile</h2>
            <p className="text-zinc-400 text-sm mb-4">Manage your account settings</p>

            <div className="space-y-4">
              {user?.role === 'superadmin' && (
                <div className="mb-4 px-3 py-2 bg-red-600/20 border border-red-600/50 rounded-lg">
                  <p className="text-red-500 text-xs font-semibold">🔥 SUPER ADMIN ACCESS</p>
                </div>
              )}

              <div>
                <label className="text-sm text-zinc-500">Email</label>
                <div className="mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                  {user?.email || 'Not logged in'}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-500">Username</label>
                <div className="mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white">
                  {(user as any)?.username || 'N/A'}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-500">User ID</label>
                <div className="mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500 font-mono">
                  {user?.id || 'N/A'}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-500">PIN</label>
                <div className="mt-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono">
                  {(user as any)?.pin || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Training Opt-In Section */}
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <DollarSign size={24} className="text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold mb-2">AI Training Program</h2>
                <p className="text-zinc-400 text-sm">
                  Help improve our AI models and earn revenue share
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">What you get:</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong className="text-white text-lg">10% OFF</strong> your monthly membership</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Automatic discount applied every month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Help create better AI models for the action film community</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Your generated images and videos are used to improve AI quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>You keep full rights to your content</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-yellow-500 mb-2">What we collect:</h3>
              <ul className="space-y-1 text-sm text-zinc-400">
                <li>• Generated images and videos from your projects</li>
                <li>• Prompts and settings you used</li>
                <li>• Character references and environment settings</li>
              </ul>
            </div>

            <label className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-red-600 transition-colors">
              <input
                type="checkbox"
                checked={trainingOptIn}
                onChange={(e) => setTrainingOptIn(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-600 focus:ring-offset-black cursor-pointer"
              />
              <div>
                <div className="font-medium text-white">
                  I want to participate in the AI Training Program
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Opt-in to share your outputs and get <strong className="text-green-500">10% OFF</strong> your monthly membership
                </div>
              </div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-500">
            <p>
              <strong className="text-zinc-400">Privacy Note:</strong> Your personal information and project ownership remain yours.
              By opting in, you only allow us to use your generated outputs for training AI models.
              You can opt-out at any time from this page. The 10% membership discount is automatically applied
              to your subscription while you remain opted in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
