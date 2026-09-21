import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export interface RankHolder {
  id: string;
  name: string;
  register_no: string;
  email: string;
  department: string;
  year: string;
  section: 'A' | 'B' | 'C' | 'D';
  overall_rank: number;
  section_rank: number;
  score: number;
  total_marks: number;
  percentage: number;
  time_taken_seconds: number | null;
  attempts_count: number;
  has_attempted: boolean;
  status: 'submitted' | 'in_progress' | 'enrolled';
  submitted_at: string | null;
  test_title: string;
  is_topper: boolean;
  honor_type?: 'gold' | 'silver' | 'bronze' | null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const sectionFilter = (url.searchParams.get('section') || 'all').toUpperCase();
  const roundFilter = url.searchParams.get('roundId') || 'all';

  try {
    // 1. Fetch all rounds for filter dropdown
    const { data: roundsData } = await supabaseAdmin
      .from('rounds')
      .select('id, title, round_number, status')
      .order('round_number', { ascending: true });

    // 2. Fetch profiles of all enrolled undergraduates
    const { data: profData, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, register_number, email, phone, department, year, section, created_at')
      .eq('role', 'participant')
      .order('created_at', { ascending: false });

    if (profErr) throw profErr;

    // 3. Fetch direct participants (if any registered via standalone registration)
    const { data: partData } = await supabaseAdmin
      .from('participants')
      .select('id, name, register_no, email, phone, created_at')
      .order('created_at', { ascending: false });

    // 4. Fetch all test attempts
    let attemptsQuery = supabaseAdmin
      .from('attempts')
      .select('id, participant_id, user_id, round_id, score, total_marks, status, submitted_at, time_taken_seconds, rounds(id, title, round_number)')
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true });

    if (roundFilter !== 'all') {
      attemptsQuery = attemptsQuery.eq('round_id', roundFilter);
    }

    const { data: allAttempts, error: attErr } = await attemptsQuery;
    if (attErr) throw attErr;

    // Map attempts by participant ID and user ID
    const attemptsByPartId = new Map<string, any[]>();
    const attemptsByUserId = new Map<string, any[]>();

    (allAttempts || []).forEach((att) => {
      if (att.participant_id) {
        const list = attemptsByPartId.get(att.participant_id) || [];
        list.push(att);
        attemptsByPartId.set(att.participant_id, list);
      }
      if (att.user_id) {
        const list = attemptsByUserId.get(att.user_id) || [];
        list.push(att);
        attemptsByUserId.set(att.user_id, list);
      }
    });

    // 5. Combine and deduplicate all enrolled undergraduates
    const unifiedMap = new Map<string, any>();

    (profData || []).forEach((prof) => {
      const regKey = (prof.register_number || prof.id).trim().toUpperCase();
      unifiedMap.set(regKey, {
        id: prof.id,
        name: prof.display_name || 'Undergraduate Student',
        register_no: prof.register_number || 'N/A',
        email: prof.email || '',
        department: prof.department || 'ECE',
        year: prof.year || '3rd',
        section: (prof.section || '').trim().toUpperCase(),
        created_at: prof.created_at,
        isProfile: true,
      });
    });

    (partData || []).forEach((part) => {
      const regKey = (part.register_no || part.id).trim().toUpperCase();
      const existing = unifiedMap.get(regKey) || {};
      unifiedMap.set(regKey, {
        ...existing,
        id: part.id,
        name: part.name || existing.name || 'Undergraduate Student',
        register_no: part.register_no || existing.register_no || 'N/A',
        email: part.email || existing.email || '',
        department: existing.department || 'ECE',
        year: existing.year || '3rd',
        section: existing.section || '',
        created_at: part.created_at || existing.created_at,
        participant_id: part.id,
      });
    });

    const enrolledStudents = Array.from(unifiedMap.values());

    // 6. Enrich each student with attempts, marks, time taken, and section
    const enrichedList = enrolledStudents.map((s, idx) => {
      const attempts = s.participant_id
        ? attemptsByPartId.get(s.participant_id) || []
        : attemptsByUserId.get(s.id) || [];

      // Find best attempt
      const submittedAttempts = attempts.filter((a) => a.status === 'submitted');
      const inProgressAttempts = attempts.filter((a) => a.status === 'in_progress');

      let targetAttempt = submittedAttempts.length > 0
        ? submittedAttempts.reduce((best, cur) => (cur.score > best.score ? cur : best), submittedAttempts[0])
        : inProgressAttempts[0] || attempts[0] || null;

      // Deduce Section if not set
      let resolvedSection: 'A' | 'B' | 'C' | 'D' = 'A';
      if (['A', 'B', 'C', 'D'].includes(s.section)) {
        resolvedSection = s.section as any;
      } else if (targetAttempt?.rounds?.title) {
        const t = targetAttempt.rounds.title.toUpperCase();
        if (t.includes('SECTION A') || t.includes('SEC A')) resolvedSection = 'A';
        else if (t.includes('SECTION B') || t.includes('SEC B')) resolvedSection = 'B';
        else if (t.includes('SECTION C') || t.includes('SEC C')) resolvedSection = 'C';
        else if (t.includes('SECTION D') || t.includes('SEC D')) resolvedSection = 'D';
      } else {
        resolvedSection = (s.section && ['A', 'B', 'C', 'D'].includes(s.section)) ? s.section : 'A';
      }

      const score = targetAttempt?.score ?? 0;
      const totalMarks = targetAttempt?.total_marks || 100;
      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
      const hasAttempted = attempts.length > 0;
      const status = targetAttempt?.status || (hasAttempted ? 'in_progress' : 'enrolled');

      return {
        id: s.id,
        name: s.name,
        register_no: s.register_no,
        email: s.email,
        department: s.department,
        year: s.year,
        section: resolvedSection,
        score,
        total_marks: totalMarks,
        percentage,
        time_taken_seconds: targetAttempt?.time_taken_seconds ?? null,
        attempts_count: attempts.length,
        has_attempted: hasAttempted,
        status: status as any,
        submitted_at: targetAttempt?.submitted_at ?? null,
        test_title: targetAttempt?.rounds?.title || 'Department Undergraduate Assessment',
      };
    });

    // 7. Sort across ALL sections (Cross-Section Comparative Ranking)
    // Criteria:
    // 1) Submitted > In Progress > Enrolled
    // 2) Higher Score
    // 3) Lower Time Taken (Speed tie-breaker)
    // 4) Earlier Submission Date
    enrichedList.sort((a, b) => {
      const aSubmitted = a.status === 'submitted';
      const bSubmitted = b.status === 'submitted';
      if (aSubmitted && !bSubmitted) return -1;
      if (!aSubmitted && bSubmitted) return 1;

      if (a.score !== b.score) {
        return b.score - a.score;
      }

      const aTime = a.time_taken_seconds ?? 999999;
      const bTime = b.time_taken_seconds ?? 999999;
      if (aTime !== bTime) {
        return aTime - bTime;
      }

      const aDate = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const bDate = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      if (aDate !== bDate) {
        return aDate - bDate;
      }

      return a.name.localeCompare(b.name);
    });

    // 8. Assign Overall Ranks and Section Ranks
    const sectionCounters: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    
    const fullyRanked: RankHolder[] = enrichedList.map((st, idx) => {
      const overallRank = idx + 1;
      sectionCounters[st.section] = (sectionCounters[st.section] || 0) + 1;
      const sectionRank = sectionCounters[st.section];

      let honorType: 'gold' | 'silver' | 'bronze' | null = null;
      let isTopper = false;

      // Only submitted students with score > 0 qualify for top 3 honors
      if (st.status === 'submitted' && st.score > 0) {
        if (overallRank === 1) {
          honorType = 'gold';
          isTopper = true;
        } else if (overallRank === 2) {
          honorType = 'silver';
          isTopper = true;
        } else if (overallRank === 3) {
          honorType = 'bronze';
          isTopper = true;
        }
      }

      return {
        ...st,
        overall_rank: overallRank,
        section_rank: sectionRank,
        is_topper: isTopper,
        honor_type: honorType,
      };
    });

    // 9. Extract Top 3 Toppers
    const toppers = fullyRanked.filter((s) => s.is_topper);

    // 10. Calculate Cross-Section Benchmark Analytics
    const totalEnrolled = fullyRanked.length;
    const totalAssessed = fullyRanked.filter((s) => s.status === 'submitted').length;
    const totalScores = fullyRanked
      .filter((s) => s.status === 'submitted')
      .map((s) => s.score);

    const highestScore = totalScores.length > 0 ? Math.max(...totalScores) : 0;
    const avgScore = totalScores.length > 0
      ? Math.round(totalScores.reduce((sum, val) => sum + val, 0) / totalScores.length)
      : 0;

    const sections = ['A', 'B', 'C', 'D'] as const;
    const sectionAnalytics: Record<string, any> = {};

    sections.forEach((sec) => {
      const secStudents = fullyRanked.filter((s) => s.section === sec);
      const assessed = secStudents.filter((s) => s.status === 'submitted');
      const scores = assessed.map((s) => s.score);
      const secAvg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const secTop = scores.length > 0 ? Math.max(...scores) : 0;

      sectionAnalytics[sec] = {
        totalEnrolled: secStudents.length,
        assessed: assessed.length,
        avgScore: secAvg,
        topScore: secTop,
      };
    });

    // 11. Apply User Filter Queries (Section & Search)
    const filteredRankings = fullyRanked.filter((s) => {
      if (sectionFilter !== 'ALL' && s.section !== sectionFilter) {
        return false;
      }
      if (search) {
        const matches =
          s.name.toLowerCase().includes(search) ||
          s.register_no.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          s.department.toLowerCase().includes(search);
        if (!matches) return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      rankings: filteredRankings,
      toppers,
      stats: {
        totalEnrolled,
        totalAssessed,
        highestScore,
        avgScore,
        sectionAnalytics,
      },
      rounds: roundsData || [],
    });
  } catch (error: any) {
    console.error('Error fetching rank holders:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
