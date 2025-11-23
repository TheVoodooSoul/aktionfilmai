'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Home, Save, DollarSign } from 'lucide-react';
import Link from 'next/link';
import DataSharingOptIn from '@/components/DataSharingOptIn';

export default function SettingsPage() {
  const { user, setUser } = useStore();
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

          {/* Data Sharing Opt-In */}
          {user && <DataSharingOptIn userId={user.id} />}

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
