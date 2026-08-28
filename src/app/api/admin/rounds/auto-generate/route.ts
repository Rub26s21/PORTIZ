import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      title = 'Automated Multi-Subject Weekly Test',
      duration_minutes = 30,
      start_time = null,
      total_target_questions = 50,
      randomize_questions = true,
      randomize_options = true,
      negative_marking = false,
      negative_marks_per_wrong = 0,
    } = body;

    // 1. Fetch all questions from bank
    const { data: allQuestions, error: fetchErr } = await supabaseAdmin
      .from('questions')
      .select('*');

    if (fetchErr || !allQuestions || allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found in the Question Bank. Please upload questions first.' },
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

    // 3. Calculate questions per subject to reach target 50 questions
    const baseQuota = Math.floor(total_target_questions / numSubjects);
    let remainder = total_target_questions % numSubjects;

    const selectedQuestions: any[] = [];
    const subjectDistribution: Record<string, number> = {};

    activeSubjects.forEach((subName) => {
      const qList = subjectMap[subName];
      let quota = baseQuota + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;

      // Shuffle list
      const shuffled = [...qList].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, quota);
      selectedQuestions.push(...picked);
      subjectDistribution[subName] = picked.length;
    });

    // 4. Determine next round number
    const { data: existingRounds } = await supabaseAdmin
      .from('rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1);

    const nextRoundNum = existingRounds && existingRounds.length > 0 ? existingRounds[0].round_number + 1 : 1;

    // 5. Create new Round
    const { data: newRound, error: roundErr } = await supabaseAdmin
      .from('rounds')
      .insert({
        round_number: nextRoundNum,
        title: title.trim(),
        description: `Automated 50-Question Test generated across ${numSubjects} subjects (${selectedQuestions.length} questions total).`,
        duration_minutes: Number(duration_minutes),
        start_time: start_time || null,
        status: 'draft',
        randomize_questions: Boolean(randomize_questions),
        randomize_options: Boolean(randomize_options),
        negative_marking: Boolean(negative_marking),
        negative_marks_per_wrong: Number(negative_marks_per_wrong),
        equal_subject_distribution: true,
        questions_per_subject: baseQuota || 5,
      })
      .select()
      .single();

    if (roundErr || !newRound) {
      return NextResponse.json({ error: roundErr?.message || 'Failed to create round' }, { status: 500 });
    }

    // 6. Copy selected questions to the new round
    const insertPayloads = selectedQuestions.map((q, idx) => ({
      round_id: newRound.id,
      subject_id: q.subject_id,
      subject_name: q.subject_name || q.category,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      marks: q.marks || 1,
      negative_marks: q.negative_marks || 0,
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
      round: newRound,
      total_questions: selectedQuestions.length,
      active_subjects_count: numSubjects,
      subject_distribution: subjectDistribution,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
