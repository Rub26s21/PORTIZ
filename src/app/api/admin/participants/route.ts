import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const search = (url.searchParams.get('search') || '').toLowerCase();
  const sectionFilter = url.searchParams.get('section') || 'all';
  const statusFilter = url.searchParams.get('status') || 'all'; // 'all' | 'present' | 'absent'

  try {
    // 1. Fetch from participants table
    const { data: partData } = await supabaseAdmin
      .from('participants')
      .select('id, name, register_no, email, phone, roll_number, college, department, created_at')
      .order('created_at', { ascending: false });

    // 2. Fetch from profiles table (registered users)
    const { data: profData } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, register_number, email, department, year, created_at')
      .eq('role', 'participant')
      .order('created_at', { ascending: false });

    // 3. Fetch all attempts with rounds info
    const { data: allAttempts } = await supabaseAdmin
      .from('attempts')
      .select('id, participant_id, user_id, round_id, score, total_marks, status, started_at, submitted_at, rounds(id, title, round_number)')
      .order('submitted_at', { ascending: false });

    const attemptsByParticipantId = new Map<string, any[]>();
    const attemptsByUserId = new Map<string, any[]>();

    (allAttempts || []).forEach((att) => {
      if (att.participant_id) {
        const list = attemptsByParticipantId.get(att.participant_id) || [];
        list.push(att);
        attemptsByParticipantId.set(att.participant_id, list);
      }
      if (att.user_id) {
        const list = attemptsByUserId.get(att.user_id) || [];
        list.push(att);
        attemptsByUserId.set(att.user_id, list);
      }
    });

    const combinedMap = new Map<string, any>();

    // Add profiles
    (profData || []).forEach((prof) => {
      const regKey = (prof.register_number || prof.id).toUpperCase();
      combinedMap.set(regKey, {
        id: prof.id,
        name: prof.display_name || 'Student',
        register_no: prof.register_number || 'N/A',
        email: prof.email || '',
        phone: '',
        department: prof.department || 'ECE',
        year: prof.year || '3rd',
        section: '',
        created_at: prof.created_at,
        isProfile: true,
      });
    });

    // Add / overwrite with direct participants
    (partData || []).forEach((part) => {
      const regKey = (part.register_no || part.id).toUpperCase();
      const existing = combinedMap.get(regKey) || {};

      let parsedSection = '';
      if (part.roll_number && ['A', 'B', 'C', 'D'].includes(part.roll_number.toUpperCase())) {
        parsedSection = part.roll_number.toUpperCase();
      } else if (part.college) {
        const m = part.college.match(/Section\s*([A-D])/i);
        if (m) parsedSection = m[1].toUpperCase();
      }

      combinedMap.set(regKey, {
        ...existing,
        id: part.id,
        name: part.name || existing.name || 'Student',
        register_no: part.register_no || existing.register_no || 'N/A',
        email: part.email || existing.email || '',
        phone: part.phone || existing.phone || '',
        department: existing.department || part.department || 'ECE',
        section: parsedSection || existing.section || '',
        created_at: part.created_at || existing.created_at,
        participant_id: part.id,
      });
    });

    const combinedList = Array.from(combinedMap.values());

    // 4. Enrich each student with attempts, section deduction, attendance & score details
    const enriched = combinedList.map((p, idx) => {
      const pAttempts = p.participant_id
        ? attemptsByParticipantId.get(p.participant_id) || []
        : attemptsByUserId.get(p.id) || [];

      const attemptsCount = pAttempts.length;
      const latestAttempt = pAttempts[0] || null;
      const bestScore = pAttempts.reduce((max, a) => Math.max(max, a.score || 0), 0);
      const isPresent = attemptsCount > 0 && pAttempts.some((a) => a.status === 'submitted' || a.status === 'in_progress');

      // Deduce section strictly from participant record (from entry card) or round title
      let assignedSection = p.section;
      if (!['A', 'B', 'C', 'D'].includes(assignedSection)) {
        if (latestAttempt?.rounds?.title) {
          const t = latestAttempt.rounds.title.toUpperCase();
          if (t.includes('SECTION A') || t.includes('SEC A')) assignedSection = 'A';
          else if (t.includes('SECTION B') || t.includes('SEC B')) assignedSection = 'B';
          else if (t.includes('SECTION C') || t.includes('SEC C')) assignedSection = 'C';
          else if (t.includes('SECTION D') || t.includes('SEC D')) assignedSection = 'D';
        }
      }

      if (!['A', 'B', 'C', 'D'].includes(assignedSection)) {
        assignedSection = 'A';
      }

      return {
        ...p,
        section: assignedSection.toUpperCase(),
        attempts_count: attemptsCount,
        best_score: bestScore,
        attendance_status: isPresent ? 'present' : 'absent',
        latest_round_title: latestAttempt?.rounds?.title || null,
        latest_score: latestAttempt?.score !== undefined ? latestAttempt.score : null,
        latest_total_marks: latestAttempt?.total_marks || 100,
        time_taken_seconds:
          latestAttempt?.started_at && latestAttempt?.submitted_at
            ? Math.max(
                0,
                Math.round(
                  (new Date(latestAttempt.submitted_at).getTime() -
                    new Date(latestAttempt.started_at).getTime()) /
                    1000
                )
              )
            : null,
        submitted_at: latestAttempt?.submitted_at || null,
      };
    });

    // 5. Compute Section-Wise Attendance & Performance Statistics
    const sections = ['A', 'B', 'C', 'D'] as const;
    const sectionStats: Record<string, any> = {};

    sections.forEach((sec) => {
      const secStudents = enriched.filter((p) => p.section === sec);
      const total = secStudents.length;
      const present = secStudents.filter((p) => p.attendance_status === 'present').length;
      const absent = total - present;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      
      const scores = secStudents
        .filter((p) => p.attendance_status === 'present' && p.latest_score !== null)
        .map((p) => p.latest_score as number);
      
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const topScore = scores.length > 0 ? Math.max(...scores) : 0;

      sectionStats[sec] = {
        total,
        present,
        absent,
        attendanceRate,
        avgScore,
        topScore,
      };
    });

    const totalStudents = enriched.length;
    const overallPresent = enriched.filter((p) => p.attendance_status === 'present').length;
    const overallAbsent = totalStudents - overallPresent;
    const overallAttendanceRate = totalStudents > 0 ? Math.round((overallPresent / totalStudents) * 100) : 0;

    sectionStats['overall'] = {
      total: totalStudents,
      present: overallPresent,
      absent: overallAbsent,
      attendanceRate: overallAttendanceRate,
    };

    // 6. Filter by search, section & attendance status
    const filtered = enriched.filter((p) => {
      if (search) {
        const matchesSearch =
          p.name?.toLowerCase().includes(search) ||
          p.register_no?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.phone?.includes(search);
        if (!matchesSearch) return false;
      }

      if (sectionFilter !== 'all' && p.section !== sectionFilter.toUpperCase()) {
        return false;
      }

      if (statusFilter === 'present' && p.attendance_status !== 'present') {
        return false;
      }
      if (statusFilter === 'absent' && p.attendance_status !== 'absent') {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      participants: filtered,
      sectionStats,
      totalCount: enriched.length,
      filteredCount: filtered.length,
    });
  } catch (err: any) {
    console.error('Admin participants fetch error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
