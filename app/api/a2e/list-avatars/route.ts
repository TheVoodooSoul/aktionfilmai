import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E List Avatars API
 * Gets all avatars (user's custom + system defaults)
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

    // Call A2E character_list endpoint
    let url = 'https://video.a2e.ai/api/v1/anchor/character_list';
    if (type) {
      url += `?type=${type}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('A2E List Avatars Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('A2E List Avatars error:', errorText);
      return NextResponse.json(
        { error: `A2E API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    console.log(`Found ${data.data?.length || 0} avatars`);

    return NextResponse.json({
      avatars: data.data || [],
    });
  } catch (error) {
    console.error('List avatars error:', error);
    return NextResponse.json(
      { error: 'Failed to list avatars' },
      { status: 500 }
    );
  }
}
