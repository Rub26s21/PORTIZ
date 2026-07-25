import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attempt_id } = body;

    if (!attempt_id) {
      return NextResponse.json({ error: 'Missing attempt_id' }, { status: 400 });
    }

    // 1. Fetch attempt details + round config
    const { data: attempt, error: attErr } = await supabaseAdmin
      .from('attempts')
      .select('id, round_id, status, participant_id')
      .eq('id', attempt_id)
      .maybeSingle();

    if (attErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status === 'submitted') {
      return NextResponse.json({ error: 'Attempt already submitted' }, { status: 400 });
    }

    const { data: round } = await supabaseAdmin
      .from('rounds')
      .select('id, negative_marking, negative_marks_per_wrong')
      .eq('id', attempt.round_id)
      .maybeSingle();

    // 2. Fetch all questions for this round
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, correct_answer, marks, negative_marks')
      .eq('round_id', attempt.round_id);

    // 3. Fetch all saved responses
    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('question_id, selected')
      .eq('attempt_id', attempt_id);

    const responseMap = new Map<string, string>();
    (responses || []).forEach((r) => {
      if (r.selected !== null) responseMap.set(r.question_id, r.selected);
    });

    let totalScore = 0;

    // 4. Calculate score
    (questions || []).forEach((q) => {
      const userSel = responseMap.get(q.id);
      if (userSel !== undefined && userSel !== null && userSel !== '') {
        const correctStr = typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : String(q.correct_answer);
        if (userSel.trim().toLowerCase() === correctStr.trim().toLowerCase()) {
          totalScore += Number(q.marks || 1);
        } else if (round?.negative_marking) {
          const penalty = q.negative_marks || round.negative_marks_per_wrong || 0;
          totalScore -= Number(penalty);
        }
      }
    });

    // Final score cannot be negative
    totalScore = Math.max(0, Math.round(totalScore * 100) / 100);

    // 5. Update attempt status & score
    const { error: updateErr } = await supabaseAdmin
      .from('attempts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        score: totalScore,
      })
      .eq('id', attempt_id);

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to record final submission' }, { status: 500 });
    }

    // 6. Calculate Rank
    const { count: higherScores } = await supabaseAdmin
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', attempt.round_id)
      .eq('status', 'submitted')
      .gt('score', totalScore);

    const rank = (higherScores || 0) + 1;

    return NextResponse.json({
      success: true,
      score: totalScore,
      rank: rank,
      total_questions: (questions || []).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
