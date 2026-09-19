import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MASTER_QUESTION_POOL } from '@/lib/question-seed';

// Fisher-Yates array shuffler
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const {
      title = 'Automated Multi-Subject Weekly Test',
      duration_minutes = 45,
      start_time = null,
      mode = 'multi_section_4', // 'multi_section_4' | 'single'
      status = 'published',
      randomize_questions = true,
      randomize_options = true,
      negative_marking = false,
      negative_marks_per_wrong = 0,
    } = body;

    // 1. Fetch all central questions from the Question Bank
    const { data: dbQuestions } = await supabaseAdmin
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true });

    let allQuestions: any[] = dbQuestions && dbQuestions.length >= 50 ? dbQuestions : [];

    if (allQuestions.length < 50) {
      allQuestions = MASTER_QUESTION_POOL.map((q, idx) => ({
        id: `seed-q-${idx + 1}`,
        subject_name: q.subject_name,
        category: q.category,
        question_type: q.question_type,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks,
        negative_marks: q.negative_marks,
        difficulty: q.difficulty,
        explanation: q.explanation || null,
        order_index: idx + 1,
      }));
    }

    const totalQuestionsInBank = allQuestions.length;
    const BATCH_SIZE = 50;
    const totalBatchesCount = Math.max(1, Math.floor(totalQuestionsInBank / BATCH_SIZE));

    // 2. Fetch existing rounds to determine next round number and past batch history
    const { data: existingRounds } = await supabaseAdmin
      .from('rounds')
      .select('id, round_number, title, description, created_at')
      .order('round_number', { ascending: false });

    let latestRoundNum = existingRounds && existingRounds.length > 0 ? existingRounds[0].round_number : 0;

    // ── MODE 1: 4-SECTION ZERO-REPETITION 50-QUESTION DISTRIBUTOR (SECTIONS A, B, C, D) ──
    if (mode === 'multi_section_4') {
      const sections = ['A', 'B', 'C', 'D'] as const;

      // Slice the entire pool into 50-question batches across random subjects
      const shuffledPool = shuffleArray(allQuestions);
      const allBatches: Array<{ batchIndex: number; questions: any[] }> = [];

      for (let b = 0; b < totalBatchesCount; b++) {
        allBatches.push({
          batchIndex: b + 1,
          questions: shuffledPool.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE),
        });
      }

      // Check which test cycle this is (Cycle 1, Cycle 2, etc.)
      const cycleCount = Math.floor((latestRoundNum) / 4) + 1;

      // Select 4 distinct non-overlapping batches for Sections A, B, C, D
      // Ensure we rotate through available batches with zero repetition
      const selectedBatchIndices: number[] = [];
      const batchStartIndex = ((cycleCount - 1) * 4) % totalBatchesCount;

      for (let i = 0; i < 4; i++) {
        const batchNum = ((batchStartIndex + i) % totalBatchesCount) + 1;
        selectedBatchIndices.push(batchNum);
      }

      // Shuffle assignment order of the 4 selected batches among Sections A, B, C, D
      const shuffledSelectedBatches = shuffleArray(selectedBatchIndices);

      const createdRounds: any[] = [];
      const batchAssignments: Record<string, { batchNumber: number; questionCount: number; roundId: string; roundNumber: number }> = {};

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        const assignedBatchNum = shuffledSelectedBatches[sIdx];
        const batchData = allBatches.find((b) => b.batchIndex === assignedBatchNum) || allBatches[sIdx % allBatches.length];
        const roundNum = latestRoundNum + 1 + sIdx;

        const roundTitle = `${title.trim()} - Section ${sec}`;
        const roundDescription = `Classroom Section ${sec} (50 Questions | Batch #${assignedBatchNum} of ${totalBatchesCount} | Zero-Repetition Test Cycle #${cycleCount})`;

        // Insert Section Round
        const { data: newRound, error: roundErr } = await supabaseAdmin
          .from('rounds')
          .insert({
            round_number: roundNum,
            title: roundTitle,
            description: roundDescription,
            duration_minutes: Number(duration_minutes),
            start_time: start_time || null,
            status: status || 'published',
            randomize_questions: Boolean(randomize_questions),
            randomize_options: Boolean(randomize_options),
            negative_marking: Boolean(negative_marking),
            negative_marks_per_wrong: Number(negative_marks_per_wrong),
            equal_subject_distribution: false,
            questions_per_subject: 5,
          })
          .select()
          .single();

        if (roundErr || !newRound) {
          throw new Error(`Failed to create Section ${sec} round: ${roundErr?.message}`);
        }

        // Copy this batch's 50 questions to the new round (with randomized order_index)
        const batchQuestions = shuffleArray(batchData.questions);
        const insertPayloads = batchQuestions.map((q, qIdx) => ({
          round_id: newRound.id,
          subject_id: q.subject_id || null,
          subject_name: q.subject_name || q.category || 'General',
          question_type: q.question_type || 'mcq',
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          marks: q.marks || 2,
          negative_marks: q.negative_marks || 0.5,
          image_url: q.image_url || null,
          image_alt: q.image_alt || null,
          category: q.category || q.subject_name || 'Electronics',
          explanation: q.explanation || null,
          order_index: qIdx + 1,
        }));

        const { error: qInsertErr } = await supabaseAdmin
          .from('questions')
          .insert(insertPayloads);

        if (qInsertErr) {
          throw new Error(`Failed to insert questions for Section ${sec}: ${qInsertErr.message}`);
        }

        createdRounds.push(newRound);
        batchAssignments[sec] = {
          batchNumber: assignedBatchNum,
          questionCount: batchQuestions.length,
          roundId: newRound.id,
          roundNumber: roundNum,
        };
      }

      return NextResponse.json({
        success: true,
        mode: 'multi_section_4',
        test_cycle: cycleCount,
        total_batches_available: totalBatchesCount,
        batch_size: BATCH_SIZE,
        created_rounds: createdRounds,
        batch_assignments: batchAssignments,
        message: `Successfully generated 4-Section Test Cycle #${cycleCount} with 4 unique non-overlapping 50-question batches for Sections A, B, C, and D!`,
      }, { status: 201 });
    }

    // ── MODE 2: SINGLE 50-QUESTION TEST GENERATION ──
    const shuffledSingle = shuffleArray(allQuestions).slice(0, BATCH_SIZE);
    const nextRoundNum = latestRoundNum + 1;

    const { data: newRound, error: roundErr } = await supabaseAdmin
      .from('rounds')
      .insert({
        round_number: nextRoundNum,
        title: title.trim(),
        description: `Automated 50-Question Test generated across Question Bank (${shuffledSingle.length} questions).`,
        duration_minutes: Number(duration_minutes),
        start_time: start_time || null,
        status: status || 'published',
        randomize_questions: Boolean(randomize_questions),
        randomize_options: Boolean(randomize_options),
        negative_marking: Boolean(negative_marking),
        negative_marks_per_wrong: Number(negative_marks_per_wrong),
        equal_subject_distribution: true,
        questions_per_subject: 5,
      })
      .select()
      .single();

    if (roundErr || !newRound) {
      return NextResponse.json({ error: roundErr?.message || 'Failed to create round' }, { status: 500 });
    }

    const insertPayloads = shuffledSingle.map((q, idx) => ({
      round_id: newRound.id,
      subject_id: q.subject_id,
      subject_name: q.subject_name || q.category,
      question_type: q.question_type,
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
      mode: 'single',
      round: newRound,
      total_questions: shuffledSingle.length,
      total_batches_available: totalBatchesCount,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Auto-generate error:', err);
    return NextResponse.json({ error: err.message || 'Server error during test generation' }, { status: 500 });
  }
}
