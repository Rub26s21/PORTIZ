import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: attempts, error } = await supabaseAdmin
    .from('attempts')
    .select(`
      *,
      profiles:user_id (
        id, display_name, email, register_number, department, year
      ),
      rounds:round_id (
        title, round_number
      )
    `)
    .in('status', ['in_progress', 'submitted', 'disqualified'])
    .order('started_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get response counts per attempt
  const attemptIds = attempts?.map((a) => a.id) || [];
  let responseCounts: Record<string, number> = {};
  let violationCounts: Record<string, number> = {};

  if (attemptIds.length > 0) {
    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('attempt_id')
      .in('attempt_id', attemptIds);

    if (responses) {
      responseCounts = responses.reduce((acc: Record<string, number>, r) => {
        acc[r.attempt_id] = (acc[r.attempt_id] || 0) + 1;
        return acc;
      }, {});
    }

    const { data: events } = await supabaseAdmin
      .from('proctor_events')
      .select('attempt_id')
      .in('attempt_id', attemptIds);

    if (events) {
      violationCounts = events.reduce((acc: Record<string, number>, e) => {
        acc[e.attempt_id] = (acc[e.attempt_id] || 0) + 1;
        return acc;
      }, {});
    }
  }

  const monitoringData = attempts?.map((a) => ({
    ...a,
    questionsAnswered: responseCounts[a.id] || 0,
    violations: violationCounts[a.id] || 0,
  }));

  return NextResponse.json({ monitoring: monitoringData });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { attemptId, action } = await req.json();
    if (!attemptId || !action) {
      return NextResponse.json({ error: 'Missing attemptId or action' }, { status: 400 });
    }

    if (action === 'unlock') {
      const { error } = await supabaseAdmin
        .from('attempts')
        .update({
          status: 'in_progress',
          disqualification_reason: null,
        })
        .eq('id', attemptId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Student exam unlocked successfully!' });
    }

    if (action === 'extend_time') {
      // Get current attempt
      const { data: att } = await supabaseAdmin
        .from('attempts')
        .select('started_at')
        .eq('id', attemptId)
        .single();

      if (att && att.started_at) {
        // Shift started_at forward by 5 minutes
        const newStart = new Date(new Date(att.started_at).getTime() + 5 * 60 * 1000).toISOString();
        await supabaseAdmin.from('attempts').update({ started_at: newStart }).eq('id', attemptId);
      }

      return NextResponse.json({ success: true, message: '+5 Minutes added to student timer!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
