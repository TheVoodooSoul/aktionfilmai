import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/api/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { opt_in, userId } = await request.json();

    // User can only update their own data sharing settings
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Cannot modify another user\'s data sharing settings' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Update user's opt-in status in PROFILES table
    const updateData: any = {
      data_sharing_opt_in: opt_in,
    };

    // Set opted_in_at timestamp only when opting in for the first time
    if (opt_in) {
      updateData.data_sharing_opted_in_at = new Date().toISOString();
    }

    // First check if profile exists, if not create it
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      // Create profile for this user
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...updateData,
        });

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        opted_in: opt_in,
        message: opt_in
          ? 'Data sharing enabled. You now have 10% off all memberships!'
          : 'Data sharing disabled. Your discount has been removed.',
      });
    }

    // Update existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
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
