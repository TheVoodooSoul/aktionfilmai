import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const tokenCode = searchParams.get('tokenCode');
    const userId = searchParams.get('userId');

    if (!tokenId && !tokenCode) {
      return NextResponse.json(
        { error: 'tokenId or tokenCode is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('submission_tokens').select('*');

    if (tokenId) {
      query = query.eq('id', tokenId);
    } else if (tokenCode) {
      query = query.eq('token_code', tokenCode);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: token, error } = await query.single();

    if (error || !token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Error fetching token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token' },
      { status: 500 }
    );
  }
}
