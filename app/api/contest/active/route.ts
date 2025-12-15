import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the most recent active contest
    const { data: contest, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no active contest found, try to get the most recent one
      const { data: latestContest } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestContest) {
        return NextResponse.json({ contest: latestContest });
      }

      return NextResponse.json(
        { error: 'No contest found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ contest });
  } catch (error: any) {
    console.error('Error fetching active contest:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contest' },
      { status: 500 }
    );
  }
}
