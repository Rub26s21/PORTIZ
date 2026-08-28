import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

// ── GET: LIST ALL SCHEDULED TESTS ──
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: rounds, error } = await supabaseAdmin
    .from('rounds')
    .select('*, questions(count)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scheduled_tests: rounds || [] });
}

// ── POST: SCHEDULE A NEW 50-QUESTION TEST ──
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      title = 'Weekly Department Test',
      start_time = null,
      duration_minutes = 45,
      total_target_questions = 50,
    } = body;

    // 1. Get all questions from the subject bank
    const { data: allQuestions, error: qErr } = await supabaseAdmin
      .from('questions')
      .select('*');

    if (qErr || !allQuestions || allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available in the Subject Question Bank. Please upload subject questions first.' },
        { status: 400 }
      );
    }

    // 2. Group questions by subject
    const subjectMap: Record<string, any[]> = {};
    allQuestions.forEach((q) => {
      const sub = q.subject_name || q.category || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = [];
      subjectMap[sub].push(q);
    });

    const activeSubjects = Object.keys(subjectMap);
    const numSubjects = activeSubjects.length;

    if (numSubjects === 0) {
      return NextResponse.json({ error: 'No active subjects found in Question Bank' }, { status: 400 });
    }

    // 3. Pick 50 random balanced questions across active subjects
    const baseQuota = Math.floor(total_target_questions / numSubjects);
    let remainder = total_target_questions % numSubjects;

    const selectedQuestions: any[] = [];
    const subjectDistribution: Record<string, number> = {};

    activeSubjects.forEach((subName) => {
      const qList = subjectMap[subName];
      let quota = baseQuota + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      const shuffled = [...qList].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, quota);
      selectedQuestions.push(...picked);
      subjectDistribution[subName] = picked.length;
    });

    // 4. Calculate next test number
    const { data: existingRounds } = await supabaseAdmin
      .from('rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1);

    const nextNumber = existingRounds && existingRounds.length > 0 ? existingRounds[0].round_number + 1 : 1;
    const finalTitle = title.trim() || `Weekly Test ${nextNumber}`;

    // 5. Create new scheduled round
    const { data: newRound, error: roundErr } = await supabaseAdmin
      .from('rounds')
      .insert({
        round_number: nextNumber,
        title: finalTitle,
        description: `Automated 50-Question Weekly Department Assessment compiled across ${numSubjects} subjects.`,
        duration_minutes: Number(duration_minutes),
        start_time: start_time || new Date().toISOString(),
        status: 'live',
        randomize_questions: true,
        randomize_options: true,
        negative_marking: true,
        negative_marks_per_wrong: 0.5,
        equal_subject_distribution: true,
        questions_per_subject: baseQuota || 5,
      })
      .select()
      .single();

    if (roundErr || !newRound) {
      return NextResponse.json({ error: roundErr?.message || 'Failed to schedule test' }, { status: 500 });
    }

    // 6. Copy selected 50 questions to the new scheduled test
    const insertPayloads = selectedQuestions.map((q, idx) => ({
      round_id: newRound.id,
      subject_id: q.subject_id,
      subject_name: q.subject_name || q.category,
      question_type: q.question_type || 'mcq',
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      marks: q.marks || 2,
      negative_marks: q.negative_marks || 0.5,
      image_url: q.image_url,
      image_alt: q.image_alt,
      category: q.category,
      explanation: q.explanation,
      order_index: idx + 1,
    }));

    const { error: insertErr } = await supabaseAdmin
      .from('questions')
      .insert(insertPayloads);

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      scheduled_test: newRound,
      total_questions: selectedQuestions.length,
      active_subjects_count: numSubjects,
      subject_distribution: subjectDistribution,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
