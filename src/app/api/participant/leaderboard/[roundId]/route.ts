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

  // Check if leaderboard is enabled for this round
  const { data: round } = await supabaseAdmin
    .from('rounds')
    .select('show_leaderboard')
    .eq('id', roundId)
    .single();

  if (!round || !round.show_leaderboard) {
    return NextResponse.json({
      enabled: false,
      message: 'Leaderboard will be published by admin 📡',
    });
  }

  // Get leaderboard data
  const { data: attempts, error } = await supabaseAdmin
    .from('attempts')
    .select(`
      score, total_marks, submitted_at, status,
      profiles:user_id (
        display_name, register_number
      )
    `)
    .eq('round_id', roundId)
    .eq('status', 'submitted')
    .order('score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leaderboard = attempts?.map((a, index) => {
    const profile = (Array.isArray(a.profiles) ? a.profiles[0] : a.profiles) as any;
    return {
      rank: index + 1,
      display_name: profile?.display_name || 'Unknown',
      register_number: profile?.register_number || null,
      score: a.score,
      total_marks: a.total_marks,
      submitted_at: a.submitted_at,
    };
  });

  return NextResponse.json({ enabled: true, leaderboard });
}
