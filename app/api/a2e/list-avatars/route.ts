import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E List Avatars API
 * Gets all avatars (user's custom + system defaults) AND trained avatars with names
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
