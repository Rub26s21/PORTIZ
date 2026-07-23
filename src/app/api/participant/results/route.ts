import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Get all attempts for this user
  const { data: attempts, error } = await supabaseAdmin
    .from('attempts')
    .select(`
      *,
      rounds:round_id (
        id, title, round_number, show_results, total_marks:duration_minutes
      )
    `)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter results based on show_results setting
  const results = attempts?.map((a) => {
    const round = a.rounds as Record<string, unknown>;
    const showResults = round?.show_results;
    return {
      id: a.id,
      round_id: a.round_id,
      round_title: round?.title,
      round_number: round?.round_number,
      status: a.status,
      score: showResults ? a.score : null,
      total_marks: showResults ? a.total_marks : null,
      submitted_at: a.submitted_at,
      disqualification_reason: a.disqualification_reason,
    };
  });

  return NextResponse.json({ results });
}
