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
  const url = new URL(req.url);
  const sectionFilter = (url.searchParams.get('section') || 'all').toUpperCase();
  const currentUserId = auth.user.id;

  let targetRoundId = roundId;

  // Resolve 'latest' or 'all' to the most recent round
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

  // Get leaderboard attempts with participants and profiles relations
  let attemptsQuery = supabaseAdmin
    .from('attempts')
    .select(`
      id, score, total_marks, started_at, submitted_at, status, round_id, user_id, participant_id,
      participants:participant_id (
        id, name, register_no, roll_number, college
      ),
      profiles:user_id (
        id, display_name, register_number
      )
    `)
    .eq('status', 'submitted');

  if (targetRoundId && targetRoundId !== 'all') {
    attemptsQuery = attemptsQuery.eq('round_id', targetRoundId);
  }

  const { data: attempts, error } = await attemptsQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map into standardized list
  const studentRows = (attempts || []).map((a) => {
    const part = (Array.isArray(a.participants) ? a.participants[0] : a.participants) as any;
    const prof = (Array.isArray(a.profiles) ? a.profiles[0] : a.profiles) as any;

    const name = part?.name || prof?.display_name || 'Participant';
    const regNo = part?.register_no || prof?.register_number || 'N/A';

    let section: 'A' | 'B' | 'C' | 'D' = 'A';
    if (part?.roll_number && ['A', 'B', 'C', 'D'].includes(part.roll_number.toUpperCase())) {
      section = part.roll_number.toUpperCase() as any;
    } else if (part?.college) {
      const m = part.college.match(/Section\s*([A-D])/i);
      if (m) section = m[1].toUpperCase() as any;
    }

    const score = Number(a.score || 0);
    const totalMarks = Number(a.total_marks || 30);
    const accuracy = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    const timeTaken = a.started_at && a.submitted_at
      ? Math.max(0, Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 1000))
      : 999999;

    const isCurrentUser =
      a.user_id === currentUserId ||
      (part?.id && part.id === currentUserId) ||
      (part?.register_no && auth.user.email?.startsWith(part.register_no));

    return {
      attempt_id: a.id,
      user_id: a.user_id,
      participant_id: a.participant_id,
      display_name: name,
      register_number: regNo,
      section,
      score,
      total_marks: totalMarks,
      accuracy,
      time_taken_seconds: timeTaken,
      submitted_at: a.submitted_at,
      is_current_user: isCurrentUser,
    };
  });

  // Fair Standard Tie-Breaking Hierarchy
  studentRows.sort((a, b) => {
    // 1. Score DESC
    if (a.score !== b.score) return b.score - a.score;
    // 2. Accuracy DESC
    if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
    // 3. Time Taken ASC
    if (a.time_taken_seconds !== b.time_taken_seconds) return a.time_taken_seconds - b.time_taken_seconds;
    // 4. Submitted At ASC
    const aDate = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
    const bDate = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
    if (aDate !== bDate) return aDate - bDate;
    return a.display_name.localeCompare(b.display_name);
  });

  // Assign overall ranks & section ranks with 100% parity
  const sectionCounters: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  const fullyRanked = studentRows.map((s, idx) => {
    const overallRank = idx + 1;
    sectionCounters[s.section] = (sectionCounters[s.section] || 0) + 1;
    const sectionRank = sectionCounters[s.section];

    let honorType: 'gold' | 'silver' | 'bronze' | null = null;
    if (overallRank === 1) honorType = 'gold';
    else if (overallRank === 2) honorType = 'silver';
    else if (overallRank === 3) honorType = 'bronze';

    return {
      ...s,
      rank: overallRank,
      overall_rank: overallRank,
      section_rank: sectionRank,
      honor_type: honorType,
    };
  });

  // Overall Toppers & Section Toppers
  const overallToppers = fullyRanked.slice(0, 3);
  const sectionToppers: Record<string, any[]> = {
    A: fullyRanked.filter((s) => s.section === 'A').slice(0, 3),
    B: fullyRanked.filter((s) => s.section === 'B').slice(0, 3),
    C: fullyRanked.filter((s) => s.section === 'C').slice(0, 3),
    D: fullyRanked.filter((s) => s.section === 'D').slice(0, 3),
  };

  // Find current user's entry
  const myEntry = fullyRanked.find((s) => s.is_current_user);

  // Filter if section query specified
  const filteredList = sectionFilter !== 'ALL'
    ? fullyRanked.filter((s) => s.section === sectionFilter)
    : fullyRanked;

  return NextResponse.json({
    enabled: true,
    leaderboard: filteredList,
    overallToppers,
    sectionToppers,
    myStanding: myEntry
      ? {
          overall_rank: myEntry.overall_rank,
          section_rank: myEntry.section_rank,
          section: myEntry.section,
          score: myEntry.score,
          total_marks: myEntry.total_marks,
          accuracy: myEntry.accuracy,
        }
      : null,
    totalCount: fullyRanked.length,
  });
}
