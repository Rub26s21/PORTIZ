import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attempt_id, question_id, selected } = body;

    if (!attempt_id || !question_id) {
      return NextResponse.json({ error: 'Missing attempt_id or question_id' }, { status: 400 });
    }

    // 1. Rate Limit Defense: Max 60 saves per minute per attempt
    const rateLimit = checkRateLimit(`save:${attempt_id}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many save requests. Please slow down.' }, { status: 429 });
    }

    // 2. Verify attempt status
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('id, status, disqualified, started_at, round_id')
      .eq('id', attempt_id)
      .maybeSingle();

    if (!attempt || attempt.status === 'submitted' || attempt.disqualified) {
      return NextResponse.json({ error: 'Exam attempt closed or terminated' }, { status: 409 });
    }

    // 3. Server-Side Timer Enforcement: Prevent client-side timer manipulation
    if (attempt.started_at && attempt.round_id) {
      const { data: round } = await supabaseAdmin
        .from('rounds')
        .select('duration_minutes')
        .eq('id', attempt.round_id)
        .maybeSingle();

      if (round && round.duration_minutes) {
        const elapsedSeconds = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
        const maxAllowedSeconds = (round.duration_minutes * 60) + 90; // 90s grace for network latency

        if (elapsedSeconds > maxAllowedSeconds) {
          // Exam time has expired: auto-finalize and lock attempt
          await supabaseAdmin
            .from('attempts')
            .update({ status: 'submitted', submitted_at: new Date().toISOString() })
            .eq('id', attempt_id);

          return NextResponse.json(
            { error: 'Exam duration elapsed. Attempt has been auto-submitted.', expired: true },
            { status: 403 }
          );
        }
      }
    }

    // 4. Sanitize and upsert response
    const sanitizedSelected = selected !== undefined && selected !== null ? String(selected).trim() : null;

    const { error: saveErr } = await supabaseAdmin
      .from('responses')
      .upsert(
        {
          attempt_id,
          question_id,
          selected: sanitizedSelected,
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
