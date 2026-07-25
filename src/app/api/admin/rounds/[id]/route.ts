import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { data: round, error } = await supabaseAdmin
    .from('rounds')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  return NextResponse.json({ round });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    const body = await req.json();

    // When admin sets round to LIVE → record started_at and compute end_time
    if (body.status === 'live') {
      const { data: currentRound } = await supabaseAdmin
        .from('rounds')
        .select('duration_minutes, status')
        .eq('id', id)
        .single();

      if (currentRound && currentRound.status !== 'live') {
        const now = new Date();
        const endTime = new Date(now.getTime() + (currentRound.duration_minutes * 60 * 1000));
        body.started_at = now.toISOString();
        body.start_time = now.toISOString();
        body.end_time = endTime.toISOString();
      }
    }

    // When admin CLOSES the round → record ended_at and auto-submit in-progress attempts
    if (body.status === 'closed') {
      body.ended_at = new Date().toISOString();

      // Auto-submit all in-progress attempts for this round
      const { data: inProgressAttempts } = await supabaseAdmin
        .from('attempts')
        .select('id, user_id, round_id')
        .eq('round_id', id)
        .eq('status', 'in_progress');

      if (inProgressAttempts && inProgressAttempts.length > 0) {
        // Score and submit each in-progress attempt
        for (const attempt of inProgressAttempts) {
          // Calculate score from existing responses
          const { data: responses } = await supabaseAdmin
            .from('responses')
            .select('marks_awarded')
            .eq('attempt_id', attempt.id);

          const score = responses?.reduce((sum, r) => sum + (r.marks_awarded || 0), 0) || 0;

          await supabaseAdmin
            .from('attempts')
            .update({
              status: 'submitted',
              submitted_at: new Date().toISOString(),
              score,
            })
            .eq('id', attempt.id);
        }
      }
    }

    const { data: round, error } = await supabaseAdmin
      .from('rounds')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ round });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { error } = await supabaseAdmin.from('rounds').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
