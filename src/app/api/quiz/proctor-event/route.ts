import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attempt_id, eventType } = body;

    if (!attempt_id || !eventType) {
      return NextResponse.json({ error: 'Missing attempt_id or eventType' }, { status: 400 });
    }

    // 1. Verify attempt exists
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('id, status, disqualified')
      .eq('id', attempt_id)
      .maybeSingle();

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // 2. Insert into proctor_events table
    try {
      await supabaseAdmin.from('proctor_events').insert({
        attempt_id: attempt_id,
        event_type: eventType,
      });
    } catch {
      // Safe fallback if table schema varies
    }

    return NextResponse.json({ success: true, logged_at: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
