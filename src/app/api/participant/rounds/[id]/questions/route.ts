import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: roundId } = await params;

  // Get user's attempt
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .select('id, question_order, option_order, started_at, status')
    .eq('user_id', auth.user.id)
    .eq('round_id', roundId)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'No active attempt found' }, { status: 404 });
  }

  if (attempt.status !== 'in_progress') {
    return NextResponse.json({ error: 'This attempt is no longer active' }, { status: 400 });
  }

  // Get all questions for this round - WITHOUT correct_answer
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('questions')
    .select('id, round_id, question_type, question_text, options, marks, negative_marks, category, difficulty, order_index')
    .eq('round_id', roundId);

  if (questionsError || !questions) {
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
  }

  // Order questions according to attempt's randomized order
  const questionOrder = attempt.question_order as string[];
  const optionOrder = (attempt.option_order || {}) as Record<string, number[]>;

  const orderedQuestions = questionOrder.map((qId) => {
    const q = questions.find((question) => question.id === qId);
    if (!q) return null;

    // Reorder options if MCQ and option order exists
    let orderedOptions = q.options;
    if (q.question_type === 'mcq' && q.options && optionOrder[q.id]) {
      orderedOptions = optionOrder[q.id].map((idx: number) => (q.options as string[])[idx]);
    }

    return {
      ...q,
      options: orderedOptions,
    };
  }).filter(Boolean);

  // Get existing responses
  const { data: responses } = await supabaseAdmin
    .from('responses')
    .select('question_id, selected_answer')
    .eq('attempt_id', attempt.id);

  // Get round info for timer
  const { data: round } = await supabaseAdmin
    .from('rounds')
    .select('duration_minutes, end_time')
    .eq('id', roundId)
    .single();

  return NextResponse.json({
    questions: orderedQuestions,
    responses: responses || [],
    attempt: {
      id: attempt.id,
      started_at: attempt.started_at,
    },
    round: {
      duration_minutes: round?.duration_minutes || 0,
      end_time: round?.end_time || '',
    },
  });
}
