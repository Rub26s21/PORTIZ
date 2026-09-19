import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  // 1. Get all active rounds from database
  const { data: rounds, error: roundsError } = await supabaseAdmin
    .from('rounds')
    .select('*')
    .in('status', ['published', 'live', 'closed', 'active', 'ongoing'])
    .order('round_number', { ascending: true });

  if (roundsError) {
    return NextResponse.json({ error: roundsError.message }, { status: 500 });
  }

  // 2. Check if user is logged in via legacy auth (optional)
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    // Unauthenticated public request (e.g. landing page / quick entry card)
    const publicRounds = (rounds || []).map((round) => ({
      ...round,
      is_eligible: true,
      has_attempted: false,
      attempt_status: null,
    }));
    return NextResponse.json({ rounds: publicRounds });
  }

  // 3. Authenticated participant: Get eligibility and past attempts
  const { data: eligibility } = await supabaseAdmin
    .from('round_eligibility')
    .select('round_id')
    .eq('user_id', auth.user.id);

  const eligibleRoundIds = new Set(eligibility?.map((e) => e.round_id) || []);

  const { data: attempts } = await supabaseAdmin
    .from('attempts')
    .select('round_id, status')
    .eq('user_id', auth.user.id);

  const attemptMap = new Map(attempts?.map((a) => [a.round_id, a.status]) || []);

  const participantRounds = (rounds || []).map((round) => ({
    ...round,
    is_eligible: !round.requires_promotion || eligibleRoundIds.has(round.id),
    has_attempted: attemptMap.has(round.id),
    attempt_status: attemptMap.get(round.id) || null,
  }));

  return NextResponse.json({ rounds: participantRounds });
}
