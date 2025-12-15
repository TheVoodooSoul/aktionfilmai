import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/api/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Allowed IPs for superuser creation (add your IPs here)
const ALLOWED_IPS = ['127.0.0.1', '::1', 'localhost'];

// Secret key required in header for additional protection
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    // Security Layer 1: Check for admin secret header
    const adminSecret = request.headers.get('x-admin-secret');
    if (ADMIN_SECRET && adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin secret' },
        { status: 401 }
      );
    }

    // Security Layer 2: Try to verify if caller is already an admin
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      // If no admin auth, check if this is the FIRST superuser creation
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_tier', 'superadmin');

      // Only allow unauthenticated creation if NO superadmins exist yet
      if (count && count > 0) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin authentication required' },
          { status: 401 }
        );
      }
      console.log('First superuser creation - allowing without auth');
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Create the user with admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create superadmin profile with 9999 credits
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        credits: 9999,
        subscription_tier: 'superadmin',
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json(
        { error: 'User created but profile failed: ' + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        credits: 9999,
        tier: 'superadmin',
      },
    });
  } catch (error: any) {
    console.error('Superuser creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create superuser' },
      { status: 500 }
    );
  }
}
