import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { roundId } = await params;
  let targetRoundId = roundId;

  // Resolve 'latest' or 'all' to the most recent live or submitted round
  if (targetRoundId === 'latest' || targetRoundId === 'all' || !targetRoundId) {
    const { data: latestRound } = await supabaseAdmin
      .from('rounds')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRound) {
      targetRoundId = latestRound.id;
    }
  }

  // Get leaderboard attempts with both participant_id and user_id relations
  let attemptsQuery = supabaseAdmin
    .from('attempts')
    .select(`
      id, score, total_marks, submitted_at, status, round_id,
      participants:participant_id (
        name, register_no
      ),
      profiles:user_id (
        display_name, register_number
      )
    `)
    .eq('status', 'submitted')
    .order('score', { ascending: false })
    .order('submitted_at', { ascending: true });

  if (targetRoundId && targetRoundId !== 'all') {
    attemptsQuery = attemptsQuery.eq('round_id', targetRoundId);
  }

  const { data: attempts, error } = await attemptsQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leaderboard = (attempts || []).map((a, index) => {
    const part = (Array.isArray(a.participants) ? a.participants[0] : a.participants) as any;
    const prof = (Array.isArray(a.profiles) ? a.profiles[0] : a.profiles) as any;

    const name = part?.name || prof?.display_name || 'Participant';
    const regNo = part?.register_no || prof?.register_number || 'N/A';

    return {
      rank: index + 1,
      display_name: name,
      register_number: regNo,
      score: a.score || 0,
      total_marks: a.total_marks || 50,
      submitted_at: a.submitted_at,
    };
  });

  return NextResponse.json({ enabled: true, leaderboard });
}
