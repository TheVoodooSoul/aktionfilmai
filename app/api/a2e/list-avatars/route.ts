import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * A2E List Avatars API
 * Gets all avatars (user's custom + system defaults) AND trained avatars with names
 * Filters by ownership: shows user's own avatars + public avatars from others
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || ''; // 'custom' or empty for all

    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    console.log('List Avatars Request:', { type, currentUserId });

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    // Fetch both character_list (anchors) and userVideoTwin (trained avatars with names)
    const [anchorsResponse, trainedResponse] = await Promise.all([
      // Character list (anchors for video generation)
      fetch('https://video.a2e.ai/api/v1/anchor/character_list' + (type ? `?type=${type}` : ''), {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      }),
      // Trained avatars (userVideoTwin) - these have names
      fetch('https://video.a2e.ai/api/v1/userVideoTwin/list', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      }),
    ]);

    console.log('A2E List Avatars Response status:', anchorsResponse.status);
    console.log('A2E List Trained Response status:', trainedResponse.status);

    let anchors: any[] = [];
    let trainedAvatars: any[] = [];

    // Parse anchors response
    if (anchorsResponse.ok) {
      const anchorsData = await anchorsResponse.json();
      if (anchorsData.code === 0) {
        anchors = anchorsData.data || [];
      }
    }

    // Parse trained avatars response
    if (trainedResponse.ok) {
      const trainedData = await trainedResponse.json();
      if (trainedData.code === 0) {
        trainedAvatars = trainedData.data || [];
      }
    }

    // Create a map of trained avatar names by their ID
    const trainedNameMap = new Map<string, { name: string; gender?: string; image_url?: string; current_status?: string }>();
    for (const trained of trainedAvatars) {
      if (trained._id && trained.name) {
        trainedNameMap.set(trained._id, {
          name: trained.name,
          gender: trained.gender,
          image_url: trained.image_url,
          current_status: trained.current_status,
        });
      }
    }

    // Merge names into anchors that have matching user_video_twin_id
    const enrichedAvatars = anchors.map(anchor => {
      const twinId = anchor.user_video_twin_id;
      const trainedInfo = twinId ? trainedNameMap.get(twinId) : null;

      return {
        ...anchor,
        name: trainedInfo?.name || anchor.name || null,
        gender: trainedInfo?.gender || anchor.gender,
        image_url: trainedInfo?.image_url || anchor.image_url,
        current_status: trainedInfo?.current_status,
      };
    });

    // Also include trained avatars that don't have anchors yet (still training)
    const anchorTwinIds = new Set(anchors.map(a => a.user_video_twin_id).filter(Boolean));
    const pendingTrained = trainedAvatars
      .filter(t => !anchorTwinIds.has(t._id))
      .map(t => ({
        _id: t._id,
        name: t.name,
        type: 'custom' as const,
        video_cover: t.image_url || '',
        base_video: '',
        createdAt: t.createdAt,
        user_video_twin_id: t._id,
        gender: t.gender,
        image_url: t.image_url,
        current_status: t.current_status,
        is_training: t.current_status !== 'done' && t.current_status !== 'completed',
      }));

    const allAvatars = [...enrichedAvatars, ...pendingTrained];

    console.log(`Found ${anchors.length} anchors, ${trainedAvatars.length} trained, ${allAvatars.length} total avatars`);

    // Fetch ownership data from our database (only avatars, not scenes/storyboards)
    const { data: ownedAvatars } = await supabase
      .from('character_references')
      .select('avatar_id, user_id, is_public, generation_type')
      .or('generation_type.eq.avatar,generation_type.is.null');

    // Create a map of avatar_id -> ownership info
    const ownershipMap = new Map<string, { user_id: string; is_public: boolean }>();
    for (const owned of (ownedAvatars || [])) {
      if (owned.avatar_id) {
        ownershipMap.set(owned.avatar_id, {
          user_id: owned.user_id,
          is_public: owned.is_public ?? false,
        });
      }
    }

    // Filter avatars based on ownership:
    // - Show user's own avatars (regardless of is_public)
    // - Show public avatars from others (is_public = true)
    // - Show avatars not in our database (legacy/system avatars)
    const filteredAvatars = allAvatars.filter(avatar => {
      const twinId = avatar.user_video_twin_id || avatar._id;
      const ownership = ownershipMap.get(twinId);

      // If not tracked in our database, show it (system/legacy avatars)
      if (!ownership) {
        return true;
      }

      // Show if user owns it
      if (ownership.user_id === currentUserId) {
        return true;
      }

      // Show if it's public
      if (ownership.is_public) {
        return true;
      }

      // Otherwise hide (belongs to someone else and is private)
      return false;
    });

    // Add ownership info to each avatar for UI
    const avatarsWithOwnership = filteredAvatars.map(avatar => {
      const twinId = avatar.user_video_twin_id || avatar._id;
      const ownership = ownershipMap.get(twinId);
      return {
        ...avatar,
        is_owned: ownership?.user_id === currentUserId,
        is_public: ownership?.is_public ?? true, // Default to public for legacy
      };
    });

    console.log(`Filtered to ${avatarsWithOwnership.length} avatars for user ${currentUserId}`);

    return NextResponse.json({
      avatars: avatarsWithOwnership,
      trained: trainedAvatars, // Also return raw trained list for @mention lookups
    });
  } catch (error) {
    console.error('List avatars error:', error);
    return NextResponse.json(
      { error: 'Failed to list avatars' },
      { status: 500 }
    );
  }
}
