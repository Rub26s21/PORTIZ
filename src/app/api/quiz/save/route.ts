import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attempt_id, question_id, selected } = body;

    if (!attempt_id || !question_id) {
      return NextResponse.json({ error: 'Missing attempt_id or question_id' }, { status: 400 });
    }

    // 1. Verify attempt status
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('status, disqualified')
      .eq('id', attempt_id)
      .maybeSingle();

    if (!attempt || attempt.status === 'submitted' || attempt.disqualified) {
      return NextResponse.json({ error: 'Attempt closed' }, { status: 409 });
    }

    // 2. Upsert response
    const { error: saveErr } = await supabaseAdmin
      .from('responses')
      .upsert(
        {
          attempt_id,
          question_id,
          selected: selected !== undefined ? String(selected) : null,
          saved_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id,question_id' }
      );

    if (saveErr) {
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved_at: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
