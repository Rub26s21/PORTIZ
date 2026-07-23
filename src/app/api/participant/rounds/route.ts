import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Get all active rounds
  const { data: rounds, error: roundsError } = await supabaseAdmin
    .from('rounds')
    .select('*')
    .in('status', ['published', 'live', 'closed'])
    .order('round_number', { ascending: true });

  if (roundsError) {
    return NextResponse.json({ error: roundsError.message }, { status: 500 });
  }

  // Get eligibility for the user
  const { data: eligibility } = await supabaseAdmin
    .from('round_eligibility')
    .select('round_id')
    .eq('user_id', auth.user.id);

  const eligibleRoundIds = new Set(eligibility?.map((e) => e.round_id) || []);

  // Get user's attempts
  const { data: attempts } = await supabaseAdmin
    .from('attempts')
    .select('round_id, status')
    .eq('user_id', auth.user.id);

  const attemptMap = new Map(attempts?.map((a) => [a.round_id, a.status]) || []);

  // Build response
  const participantRounds = rounds?.map((round) => ({
    ...round,
    is_eligible: !round.requires_promotion || eligibleRoundIds.has(round.id),
    has_attempted: attemptMap.has(round.id),
    attempt_status: attemptMap.get(round.id) || null,
  }));

  return NextResponse.json({ rounds: participantRounds });
}
