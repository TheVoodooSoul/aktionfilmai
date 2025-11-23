import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
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
        email: email,
        username: email.split('@')[0],
        credits: 9999,
        subscription_tier: 'superadmin',
        role: 'superadmin',
        created_at: new Date().toISOString(),
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
        role: 'superadmin',
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
