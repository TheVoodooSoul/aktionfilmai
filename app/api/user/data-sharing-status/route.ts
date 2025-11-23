import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get user from session/auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's opt-in status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('data_sharing_opt_in, data_sharing_opted_in_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching opt-in status:', userError);
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
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
