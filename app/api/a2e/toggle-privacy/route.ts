import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Toggle avatar privacy (public/private)
 * Only the owner can change privacy settings
 */
export async function POST(req: NextRequest) {
  try {
    const { avatarId, isPublic } = await req.json();

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatarId is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if avatar exists in our database
    const { data: existing } = await supabase
      .from('character_references')
      .select('id, user_id, is_public')
      .eq('avatar_id', avatarId)
      .single();

    if (!existing) {
      // Avatar not tracked yet - create entry for current user
      const { error: insertError } = await supabase
        .from('character_references')
        .insert({
          avatar_id: avatarId,
          user_id: user.id,
          is_public: isPublic ?? false,
          name: 'Unnamed Avatar',
          image_url: '',
          generation_type: 'avatar',
        });

      if (insertError) {
        console.error('Failed to create avatar record:', insertError);
        return NextResponse.json(
          { error: 'Failed to save privacy setting' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        is_public: isPublic ?? false,
        message: 'Avatar privacy updated',
      });
    }

    // Check ownership
    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only change privacy settings for your own avatars' },
        { status: 403 }
      );
    }

    // Update privacy setting
    const { error: updateError } = await supabase
      .from('character_references')
      .update({ is_public: isPublic })
      .eq('avatar_id', avatarId);

    if (updateError) {
      console.error('Failed to update privacy:', updateError);
      return NextResponse.json(
        { error: 'Failed to update privacy setting' },
        { status: 500 }
      );
    }

    console.log('Avatar privacy updated:', { avatarId, isPublic, userId: user.id });

    return NextResponse.json({
      success: true,
      is_public: isPublic,
      message: isPublic ? 'Avatar is now public' : 'Avatar is now private',
    });
  } catch (error) {
    console.error('Toggle privacy error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle privacy' },
      { status: 500 }
    );
  }
}
