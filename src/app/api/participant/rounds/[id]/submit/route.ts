import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateAttemptScore } from '@/lib/scoring';
import { Question, SelectedAnswer } from '@/types/database';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: roundId } = await params;

  let forceDisqualify = false;
  let reason = '';

  try {
    const body = await req.json();
    forceDisqualify = body.forceDisqualify || false;
    reason = body.reason || '';
  } catch {
    // No body is OK for normal submit
  }

  // Get attempt
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('round_id', roundId)
    .eq('status', 'in_progress')
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'No active attempt found' }, { status: 404 });
  }

  // Get round for time validation
  const { data: round } = await supabaseAdmin
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (!round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  // Server-side time validation (unless force disqualify)
  if (!forceDisqualify) {
    const now = new Date();
    const startedAt = new Date(attempt.started_at || Date.now());
    const durationEnd = new Date(startedAt.getTime() + (round.duration_minutes || 45) * 60 * 1000);

    let effectiveEnd = durationEnd;
    if (round.end_time) {
      const roundEnd = new Date(round.end_time);
      if (!isNaN(roundEnd.getTime())) {
        effectiveEnd = new Date(Math.min(durationEnd.getTime(), roundEnd.getTime()));
      }
    }

    // Allow 2 minutes grace period for network latency
    if (now.getTime() > effectiveEnd.getTime() + 120000) {
      forceDisqualify = true;
      reason = 'time_expired';
    }
  }

  // Get all questions with correct answers (SERVER SIDE ONLY)
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('round_id', roundId);

  // Get all responses for this attempt
  const { data: responses } = await supabaseAdmin
    .from('responses')
    .select('question_id, selected_answer')
    .eq('attempt_id', attempt.id);

  // Handle option order mapping for MCQ answers
  const optionOrder = (attempt.option_order || {}) as Record<string, number[]>;

  // Map responses back to original option indices
  const mappedResponses = (responses || []).map((r) => {
    const answer = r.selected_answer as SelectedAnswer | null;
    if (answer && answer.type === 'mcq' && optionOrder[r.question_id]) {
      // Map the displayed index back to the original index
      const originalIndex = optionOrder[r.question_id][answer.value];
      return {
        question_id: r.question_id,
        selected_answer: { type: 'mcq' as const, value: originalIndex },
      };
    }
    return {
      question_id: r.question_id,
      selected_answer: answer,
    };
  });

  // Calculate score server-side
  const scoreResult = calculateAttemptScore(
    questions as Question[],
    mappedResponses,
    round.negative_marking,
    round.negative_marks_per_wrong
  );

  // Update individual response records
  for (const result of scoreResult.results) {
    await supabaseAdmin
      .from('responses')
      .update({
        is_correct: result.isCorrect,
        marks_awarded: result.marksAwarded,
      })
      .eq('attempt_id', attempt.id)
      .eq('question_id', result.questionId);
  }

  // Update attempt
  const status = forceDisqualify ? 'disqualified' : 'submitted';

  const { error: updateError } = await supabaseAdmin
    .from('attempts')
    .update({
      status,
      score: scoreResult.totalScore,
      total_marks: scoreResult.totalMarks,
      submitted_at: new Date().toISOString(),
      disqualification_reason: forceDisqualify ? reason : null,
    })
    .eq('id', attempt.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    status,
    score: round.show_results ? scoreResult.totalScore : undefined,
    totalMarks: round.show_results ? scoreResult.totalMarks : undefined,
    reason: forceDisqualify ? reason : undefined,
  });
}
