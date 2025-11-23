import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { opt_in } = await request.json();

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

    // Update user's opt-in status
    const updateData: any = {
      data_sharing_opt_in: opt_in,
    };

    // Set opted_in_at timestamp only when opting in for the first time
    if (opt_in) {
      updateData.data_sharing_opted_in_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating opt-in status:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      opted_in: data.data_sharing_opt_in,
      message: opt_in
        ? 'Data sharing enabled. You now have 10% off all memberships!'
        : 'Data sharing disabled. Your discount has been removed.',
    });
  } catch (error) {
    console.error('Error in update-data-sharing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
