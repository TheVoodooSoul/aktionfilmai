import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  } | null;
  error: string | null;
}

/**
 * Verify user authentication from request
 * Checks for Bearer token in Authorization header or validates userId against session
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return {
    user: {
      id: user.id,
      email: user.email
    },
    error: null
  };
}

/**
 * Middleware helper - returns error response if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | AuthResult['user']> {
  const { user, error } = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: error || 'Unauthorized' },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Check if a userId from request body matches the authenticated user
 * This prevents users from impersonating other users
 */
export function validateUserIdMatch(
  authenticatedUserId: string,
  requestedUserId: string | null | undefined
): boolean {
  if (!requestedUserId) return false;
  return authenticatedUserId === requestedUserId;
}

/**
 * Require admin authentication
 * Checks if user is a superadmin (for sensitive operations)
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | AuthResult['user']> {
  const { user, error } = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: error || 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if user is superadmin
  const supabase = createClient(
    supabaseUrl,
    process.env.SUPABASE_PRIVATE_KEY!
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_superadmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return user;
}
