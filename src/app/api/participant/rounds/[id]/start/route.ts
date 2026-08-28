import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateQuestionOrder, generateOptionOrder } from '@/lib/scoring';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: roundId } = await params;

  // Get round
  const { data: round, error: roundError } = await supabaseAdmin
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  // Check round is live (admin has manually started it)
  if (round.status !== 'live') {
    return NextResponse.json({ error: 'Round is not currently live' }, { status: 400 });
  }

  // Check eligibility if round requires promotion
  if (round.requires_promotion) {
    const { data: eligibility } = await supabaseAdmin
      .from('round_eligibility')
      .select('id')
      .eq('round_id', roundId)
      .eq('user_id', auth.user.id)
      .single();

    if (!eligibility) {
      return NextResponse.json({ error: 'You are not eligible for this round' }, { status: 403 });
    }
  }

  // Check existing attempt
  const { data: existingAttempt } = await supabaseAdmin
    .from('attempts')
    .select('id, status')
    .eq('user_id', auth.user.id)
    .eq('round_id', roundId)
    .single();

  if (existingAttempt) {
    if (existingAttempt.status === 'in_progress') {
      return NextResponse.json({
        attemptId: existingAttempt.id,
        message: 'Existing attempt found',
      });
    }
    return NextResponse.json({ error: 'You have already completed this round' }, { status: 400 });
  }

  // Get questions for randomization
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('id, question_type, options, subject_name, category, marks')
    .eq('round_id', roundId);

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions available for this round' }, { status: 400 });
  }

  let sampledQuestions = questions;

  // Equal Subject Distribution Sampling (e.g. 5 questions per subject across 10 subjects = 50 questions)
  if (round.equal_subject_distribution && questions.length > 0) {
    const subjectGroups: Record<string, any[]> = {};
    questions.forEach((q) => {
      const subKey = q.subject_name || q.category || 'General';
      if (!subjectGroups[subKey]) subjectGroups[subKey] = [];
      subjectGroups[subKey].push(q);
    });

    const perSubjectQuota = round.questions_per_subject || 5;
    const finalSelected: any[] = [];

    Object.values(subjectGroups).forEach((qList) => {
      const shuffled = [...qList].sort(() => Math.random() - 0.5);
      finalSelected.push(...shuffled.slice(0, perSubjectQuota));
    });

    if (finalSelected.length > 0) {
      sampledQuestions = finalSelected;
    }
  }

  // Generate randomized orders
  const questionOrder = round.randomize_questions
    ? generateQuestionOrder(sampledQuestions.map((q) => q.id))
    : sampledQuestions.map((q) => q.id);

  const optionOrder = round.randomize_options
    ? generateOptionOrder(sampledQuestions as any)
    : {};

  // Calculate total marks of sampled paper
  const totalMarks = sampledQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

  // Create attempt
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('attempts')
    .insert({
      user_id: auth.user.id,
      round_id: roundId,
      started_at: new Date().toISOString(),
      total_marks: totalMarks,
      question_order: questionOrder,
      option_order: optionOrder,
    })
    .select()
    .single();

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 400 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    message: 'Test started',
  }, { status: 201 });
}
