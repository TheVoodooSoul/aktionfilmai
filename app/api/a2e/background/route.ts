import { NextRequest, NextResponse } from 'next/server';

/**
 * A2E Background Management API
 * Add and manage custom backgrounds for avatar videos
 */

// POST - Add new background
export async function POST(req: NextRequest) {
  try {
    const { imgUrl, name } = await req.json();

    console.log('A2E Add Background Request:', {
      hasImgUrl: !!imgUrl,
      name,
    });

    if (!imgUrl) {
      return NextResponse.json(
        { error: 'imgUrl is required' },
        { status: 400 }
      );
    }

    // Add custom background
    const response = await fetch('https://video.a2e.ai/api/v1/custom_back/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Custom Background',
        img_url: imgUrl,
      }),
    });

    console.log('A2E Add Background Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Add Background Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      background_id: data.data._id,
      name: data.data.name,
      img_url: data.data.img_url,
      status: 'success',
    });
  } catch (error) {
    console.error('A2E Add Background error:', error);
    return NextResponse.json(
      { error: 'Failed to add background' },
      { status: 500 }
    );
  }
}

// GET - List all backgrounds
export async function GET(req: NextRequest) {
  try {
    console.log('A2E List Backgrounds Request');

    const response = await fetch('https://video.a2e.ai/api/v1/custom_back/allBackground', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.A2E_API_KEY}`,
      },
    });

    console.log('A2E List Backgrounds Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E List Backgrounds Response:', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { error: `A2E API error: ${response.status} - ${responseText.substring(0, 200)}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);

    if (data.code !== 0) {
      return NextResponse.json(
        { error: 'A2E API returned an error: ' + (data.message || 'Unknown error') },
        { status: 500 }
      );
    }

    return NextResponse.json({
      backgrounds: data.data || [],
      status: 'success',
    });
  } catch (error) {
    console.error('A2E List Backgrounds error:', error);
    return NextResponse.json(
      { error: 'Failed to list backgrounds' },
      { status: 500 }
    );
  }
}
