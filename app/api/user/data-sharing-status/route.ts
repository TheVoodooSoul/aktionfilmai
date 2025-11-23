import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's opt-in status from PROFILES table
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('data_sharing_opt_in, data_sharing_opted_in_at')
      .eq('id', userId)
      .single();

    if (userError) {
      // Profile doesn't exist yet, return default
      return NextResponse.json({
        opted_in: false,
        opted_in_at: null,
      });
    }

    return NextResponse.json({
      opted_in: userData?.data_sharing_opt_in || false,
      opted_in_at: userData?.data_sharing_opted_in_at || null,
    });
  } catch (error) {
    console.error('Error in data-sharing-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
