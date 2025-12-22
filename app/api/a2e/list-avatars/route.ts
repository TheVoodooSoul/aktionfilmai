import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A2E List Avatars API
 * Gets all avatars (user's custom + system defaults) AND trained avatars with names
 * Also merges in stored image URLs from our character_references table
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || ''; // 'custom' or empty for all

    console.log('List Avatars Request:', { type });

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    // Fetch both character_list (anchors), userVideoTwin (trained avatars), and our stored data
    const [anchorsResponse, trainedResponse, storedRefs] = await Promise.all([
      // Character list (anchors for video generation)
      fetch('https://video.a2e.ai/api/v1/anchor/character_list' + (type ? `?type=${type}` : ''), {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      }),
      // Trained avatars (userVideoTwin) - these have names
      fetch('https://video.a2e.ai/api/v1/userVideoTwin/list', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      }),
      // Our stored character references with reliable Supabase image URLs
      supabase
        .from('character_references')
        .select('avatar_id, image_url, name')
        .not('avatar_id', 'is', null)
        .not('image_url', 'is', null),
    ]);

    console.log('A2E List Avatars Response status:', anchorsResponse.status);
    console.log('A2E List Trained Response status:', trainedResponse.status);
    console.log('Stored refs:', storedRefs.data?.length || 0, 'records');

    let anchors: any[] = [];
    let trainedAvatars: any[] = [];

    // Build map of our stored image URLs (from Supabase storage - most reliable)
    const storedImageMap = new Map<string, string>();
    if (storedRefs.data) {
      for (const ref of storedRefs.data) {
        if (ref.avatar_id && ref.image_url) {
          storedImageMap.set(ref.avatar_id, ref.image_url);
        }
      }
    }

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
    // Priority for image_url: stored (Supabase) > A2E trained > anchor
    const enrichedAvatars = anchors.map(anchor => {
      const twinId = anchor.user_video_twin_id;
      const anchorId = anchor._id;
      const trainedInfo = twinId ? trainedNameMap.get(twinId) : null;

      // Get our stored image URL (most reliable - from Supabase storage)
      const storedImageUrl = storedImageMap.get(twinId) || storedImageMap.get(anchorId);

      return {
        ...anchor,
        name: trainedInfo?.name || anchor.name || null,
        gender: trainedInfo?.gender || anchor.gender,
        // Prefer our stored URL, then A2E's, then anchor's
        image_url: storedImageUrl || trainedInfo?.image_url || anchor.image_url,
        current_status: trainedInfo?.current_status,
      };
    });

    // Also include trained avatars that don't have anchors yet (still training)
    const anchorTwinIds = new Set(anchors.map(a => a.user_video_twin_id).filter(Boolean));
    const pendingTrained = trainedAvatars
      .filter(t => !anchorTwinIds.has(t._id))
      .map(t => {
        // Prefer our stored image URL
        const storedUrl = storedImageMap.get(t._id);
        return {
          _id: t._id,
          name: t.name,
          type: 'custom' as const,
          video_cover: storedUrl || t.image_url || '',
          base_video: '',
          createdAt: t.createdAt,
          user_video_twin_id: t._id,
          gender: t.gender,
          image_url: storedUrl || t.image_url,
          current_status: t.current_status,
          is_training: t.current_status !== 'done' && t.current_status !== 'completed',
        };
      });

    const allAvatars = [...enrichedAvatars, ...pendingTrained];

    console.log(`Found ${anchors.length} anchors, ${trainedAvatars.length} trained, ${allAvatars.length} total avatars`);

    return NextResponse.json({
      avatars: allAvatars,
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
