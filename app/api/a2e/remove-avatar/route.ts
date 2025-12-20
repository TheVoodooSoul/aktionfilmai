import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * A2E Remove Avatar API
 * Delete a custom avatar created by the user
 * Falls back to hiding from gallery if A2E delete fails
 */
export async function POST(req: NextRequest) {
  try {
    const { avatarId, forceHide } = await req.json();

    console.log('Remove Avatar Request:', {
      avatarId,
      forceHide,
    });

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatarId (_id from startTraining) is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // If forceHide is true, just hide from gallery without calling A2E
    if (forceHide) {
      // Mark as 'hidden' type so it won't show in avatar gallery
      const { error: hideError } = await supabase
        .from('character_references')
        .upsert({
          avatar_id: avatarId,
          generation_type: 'hidden',
          name: 'Hidden Avatar',
          image_url: '',
        }, {
          onConflict: 'avatar_id',
        });

      if (hideError) {
        console.error('Failed to hide avatar:', hideError);
      }

      return NextResponse.json({
        success: true,
        message: 'Avatar hidden from gallery',
        hidden: true,
      });
    }

    const apiKey = process.env.A2E_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A2E API key not configured' },
        { status: 500 }
      );
    }

    // Call A2E Remove Avatar API
    const response = await fetch('https://video.a2e.ai/api/v1/userVideoTwin/remove', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US',
      },
      body: JSON.stringify({
        _id: avatarId,
      }),
    });

    console.log('A2E Remove Avatar Response status:', response.status);
    const responseText = await response.text();
    console.log('A2E Remove Avatar Response:', responseText.substring(0, 500));

    if (!response.ok) {
      // A2E delete failed - offer to hide instead
      return NextResponse.json(
        {
          error: `A2E delete failed (${response.status}). Try "Hide from Gallery" instead.`,
          canHide: true,
          a2eError: responseText.substring(0, 200),
        },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: 'A2E returned invalid response', canHide: true },
        { status: 500 }
      );
    }

    if (data.code !== 0) {
      console.error('A2E Remove Error - Full Response:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          error: `A2E error (code ${data.code}): ${data.message || data.msg || JSON.stringify(data)}`,
          a2eResponse: data,
        },
        { status: 500 }
      );
    }

    // Also remove from our database
    await supabase
      .from('character_references')
      .delete()
      .eq('avatar_id', avatarId);

    console.log('Avatar Removed Successfully:', {
      avatarId,
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar removed successfully',
    });
  } catch (error) {
    console.error('Remove avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar', canHide: true },
      { status: 500 }
    );
  }
}
