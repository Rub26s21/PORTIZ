import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

// ── GET: LIST ALL TESTS GROUPED BY TEST NUMBER ──
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Fetch all rounds ordered by round_number
  const { data: rounds, error } = await supabaseAdmin
    .from('rounds')
    .select('*, questions(count)')
    .order('round_number', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group rounds into tests (every 4 consecutive rounds = 1 test with 4 sections)
  // Round titles follow: "Test N — Section X"
  const allRounds = rounds || [];
  const testMap: Record<number, {
    testNumber: number;
    week: number;
    testInWeek: number;
    status: 'draft' | 'live' | 'completed';
    duration_minutes: number;
    sections: Array<{
      section: string;
      roundId: string;
      roundNumber: number;
      batchNumber: string;
      questionCount: number;
      status: string;
    }>;
  }> = {};

  allRounds.forEach(round => {
    // Parse test number from title: "Test N — Section X"
    const testMatch = round.title?.match(/Test\s+(\d+)\s*[—–-]\s*Section\s+([A-D])/i);
    if (!testMatch) return;

    const testNum = parseInt(testMatch[1], 10);
    const sec = testMatch[2].toUpperCase();

    if (!testMap[testNum]) {
      const week = Math.ceil(testNum / 2);
      const testInWeek = ((testNum - 1) % 2) + 1;
      testMap[testNum] = {
        testNumber: testNum,
        week,
        testInWeek,
        status: 'draft',
        duration_minutes: round.duration_minutes || 60,
        sections: [],
      };
    }

    // Extract batch number from description
    const batchMatch = round.description?.match(/Batch\s*#?(\d+)/i);
    const batchNum = batchMatch ? batchMatch[1] : '?';

    const qCount = (round.questions as any)?.[0]?.count || 50;

    testMap[testNum].sections.push({
      section: sec,
      roundId: round.id,
      roundNumber: round.round_number,
      batchNumber: batchNum,
      questionCount: qCount,
      status: round.status,
    });

    // A test is "live" if any of its section rounds are live
    if (round.status === 'live') {
      testMap[testNum].status = 'live';
    }
  });

  // Sort sections within each test
  Object.values(testMap).forEach(test => {
    test.sections.sort((a, b) => a.section.localeCompare(b.section));
    // If all sections are completed/archived, mark test as completed
    if (test.sections.length === 4 && test.sections.every(s => s.status === 'completed' || s.status === 'archived')) {
      test.status = 'completed';
    }
  });

  const tests = Object.values(testMap).sort((a, b) => a.testNumber - b.testNumber);

  return NextResponse.json({
    tests,
    total_tests: tests.length,
    total_rounds: allRounds.length,
    total_questions: allRounds.reduce((sum, r) => sum + ((r.questions as any)?.[0]?.count || 0), 0),
  });
}

// ── PUT: ACTIVATE/DEACTIVATE TEST OR EDIT DETAILS ──
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, test_number, round_id, duration_minutes, title } = body;

    // ── ACTION: Enable (activate) an entire test (all 4 section rounds go live) ──
    if (action === 'activate_test' && test_number) {
      // First, deactivate ALL currently live rounds (only one test should be live at a time)
      await supabaseAdmin
        .from('rounds')
        .update({ status: 'draft' })
        .eq('status', 'live');

      // Find all rounds for this test number
      const { data: allRounds } = await supabaseAdmin
        .from('rounds')
        .select('id, title')
        .like('title', `Test ${test_number} — Section%`);

      if (!allRounds || allRounds.length === 0) {
        return NextResponse.json({ error: `No rounds found for Test ${test_number}` }, { status: 404 });
      }

      const roundIds = allRounds.map(r => r.id);
      const { error: activateErr } = await supabaseAdmin
        .from('rounds')
        .update({ status: 'live' })
        .in('id', roundIds);

      if (activateErr) {
        return NextResponse.json({ error: activateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Test ${test_number} is now LIVE! All 4 sections activated.`,
        activated_rounds: allRounds.map(r => r.title),
      });
    }

    // ── ACTION: Disable (deactivate) an entire test ──
    if (action === 'deactivate_test' && test_number) {
      const { data: allRounds } = await supabaseAdmin
        .from('rounds')
        .select('id, title')
        .like('title', `Test ${test_number} — Section%`);

      if (!allRounds || allRounds.length === 0) {
        return NextResponse.json({ error: `No rounds found for Test ${test_number}` }, { status: 404 });
      }

      const roundIds = allRounds.map(r => r.id);
      const { error: deactivateErr } = await supabaseAdmin
        .from('rounds')
        .update({ status: 'draft' })
        .in('id', roundIds);

      if (deactivateErr) {
        return NextResponse.json({ error: deactivateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Test ${test_number} deactivated. All 4 sections set to draft.`,
      });
    }

    // ── ACTION: Mark test as completed ──
    if (action === 'complete_test' && test_number) {
      const { data: allRounds } = await supabaseAdmin
        .from('rounds')
        .select('id')
        .like('title', `Test ${test_number} — Section%`);

      if (allRounds) {
        await supabaseAdmin
          .from('rounds')
          .update({ status: 'completed' })
          .in('id', allRounds.map(r => r.id));
      }

      return NextResponse.json({
        success: true,
        message: `Test ${test_number} marked as completed.`,
      });
    }

    // ── ACTION: Update duration for all rounds in a test ──
    if (action === 'update_duration' && test_number && duration_minutes) {
      const { data: allRounds } = await supabaseAdmin
        .from('rounds')
        .select('id')
        .like('title', `Test ${test_number} — Section%`);

      if (allRounds) {
        await supabaseAdmin
          .from('rounds')
          .update({ duration_minutes: Number(duration_minutes) })
          .in('id', allRounds.map(r => r.id));
      }

      return NextResponse.json({
        success: true,
        message: `Test ${test_number} duration updated to ${duration_minutes} minutes for all sections.`,
      });
    }

    // ── FALLBACK: Update single round by ID ──
    if (round_id) {
      const updatePayload: Record<string, any> = {};
      if (title !== undefined) updatePayload.title = title;
      if (duration_minutes !== undefined) updatePayload.duration_minutes = Number(duration_minutes);

      const { data: updatedRound, error: updateErr } = await supabaseAdmin
        .from('rounds')
        .update(updatePayload)
        .eq('id', round_id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, updated_test: updatedRound });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
