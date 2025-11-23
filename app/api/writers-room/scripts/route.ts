import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List all scripts for user
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: scripts, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching scripts:', error);
      return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 });
    }

    return NextResponse.json({ scripts });
  } catch (error) {
    console.error('Scripts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new script
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, metadata } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const { data: script, error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        title,
        content,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating script:', error);
      return NextResponse.json({ error: 'Failed to create script' }, { status: 500 });
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Scripts POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



