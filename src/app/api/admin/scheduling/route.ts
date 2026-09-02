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

// Helper: Compile 50 balanced random questions across active subjects
async function generate50QuestionPaper(roundId: string) {
  const { data: allQuestions } = await supabaseAdmin.from('questions').select('*');
  if (!allQuestions || allQuestions.length === 0) return 0;

  const subjectMap: Record<string, any[]> = {};
  allQuestions.forEach((q) => {
    const sub = q.subject_name || q.category || 'General';
    if (!subjectMap[sub]) subjectMap[sub] = [];
    subjectMap[sub].push(q);
  });

  const activeSubjects = Object.keys(subjectMap);
  const numSubjects = activeSubjects.length;
  if (numSubjects === 0) return 0;

  const baseQuota = Math.floor(50 / numSubjects);
  let remainder = 50 % numSubjects;

  const selectedQuestions: any[] = [];
  activeSubjects.forEach((subName) => {
    const qList = subjectMap[subName];
    let quota = baseQuota + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    const shuffled = [...qList].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, quota);
    selectedQuestions.push(...picked);
  });

  // Fisher-Yates Shuffle on the combined 50-question pool across subjects
  const final50Questions = [...selectedQuestions];
  for (let i = final50Questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [final50Questions[i], final50Questions[j]] = [final50Questions[j], final50Questions[i]];
  }

  // Ensure strict cap of max 50 questions
  const capped50Questions = final50Questions.slice(0, 50);

  const insertPayloads = capped50Questions.map((q, idx) => ({
    round_id: roundId,
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

  await supabaseAdmin.from('questions').insert(insertPayloads);
  return capped50Questions.length;
}

// Helper: Calculate next Monday and Friday at 6:00 PM (18:00)
function getNextMondayAndFridayAt6PM() {
  const now = new Date();
  
  // Next Monday
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(18, 0, 0, 0);

  // Next Friday
  const friday = new Date(now);
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(18, 0, 0, 0);

  return { monday, friday };
}

// ── POST: SCHEDULE SINGLE OR AUTOMATED MONDAY/FRIDAY TESTS ──
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── AUTOMATED MONDAY & FRIDAY RECURRING SCHEDULER ──
    if (action === 'auto_generate_mon_fri') {
      const { monday, friday } = getNextMondayAndFridayAt6PM();

      const { data: existingRounds } = await supabaseAdmin
        .from('rounds')
        .select('round_number')
        .order('round_number', { ascending: false })
        .limit(1);

      let lastNum = existingRounds && existingRounds.length > 0 ? existingRounds[0].round_number : 0;

      // 1. Create Monday Test
      lastNum++;
      const { data: monRound } = await supabaseAdmin
        .from('rounds')
        .insert({
          round_number: lastNum,
          title: `Weekly Test ${lastNum} (Monday 6:00 PM)`,
          description: 'Automated 50-Question Monday Evening Department Assessment (1 Hour).',
          duration_minutes: 60, // 1 Hour
          start_time: monday.toISOString(),
          status: 'live',
          randomize_questions: true,
          randomize_options: true,
          negative_marking: true,
          negative_marks_per_wrong: 0.5,
          equal_subject_distribution: true,
        })
        .select()
        .single();

      if (monRound) {
        await generate50QuestionPaper(monRound.id);
      }

      // 2. Create Friday Test
      lastNum++;
      const { data: friRound } = await supabaseAdmin
        .from('rounds')
        .insert({
          round_number: lastNum,
          title: `Weekly Test ${lastNum} (Friday 6:00 PM)`,
          description: 'Automated 50-Question Friday Evening Department Assessment (1 Hour).',
          duration_minutes: 60, // 1 Hour
          start_time: friday.toISOString(),
          status: 'live',
          randomize_questions: true,
          randomize_options: true,
          negative_marking: true,
          negative_marks_per_wrong: 0.5,
          equal_subject_distribution: true,
        })
        .select()
        .single();

      if (friRound) {
        await generate50QuestionPaper(friRound.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully generated Monday & Friday Weekly Tests at 6:00 PM (1 Hour Duration, 50 Qs per test)!',
        scheduled: [monRound, friRound],
      }, { status: 201 });
    }

    // ── STANDARD SINGLE TEST SCHEDULER ──
    const {
      title = 'Weekly Department Test',
      start_time = null,
      duration_minutes = 60, // Default 1 Hour
      total_target_questions = 50,
    } = body;

    const { data: existingRounds } = await supabaseAdmin
      .from('rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1);

    const nextNumber = existingRounds && existingRounds.length > 0 ? existingRounds[0].round_number + 1 : 1;
    const finalTitle = title.trim() || `Weekly Test ${nextNumber}`;

    const { data: newRound, error: roundErr } = await supabaseAdmin
      .from('rounds')
      .insert({
        round_number: nextNumber,
        title: finalTitle,
        description: `50-Question Department Assessment (${duration_minutes} Mins).`,
        duration_minutes: Number(duration_minutes) || 60,
        start_time: start_time || new Date().toISOString(),
        status: 'live',
        randomize_questions: true,
        randomize_options: true,
        negative_marking: true,
        negative_marks_per_wrong: 0.5,
        equal_subject_distribution: true,
      })
      .select()
      .single();

    if (roundErr || !newRound) {
      return NextResponse.json({ error: roundErr?.message || 'Failed to schedule test' }, { status: 500 });
    }

    const qCount = await generate50QuestionPaper(newRound.id);

    return NextResponse.json({
      success: true,
      scheduled_test: newRound,
      total_questions: qCount,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// ── PUT: EDIT TEST TIMER / DETAILS ──
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, title, duration_minutes, start_time, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing test ID' }, { status: 400 });
    }

    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = title;
    if (duration_minutes !== undefined) updatePayload.duration_minutes = Number(duration_minutes);
    if (start_time !== undefined) updatePayload.start_time = start_time;
    if (status !== undefined) updatePayload.status = status;

    const { data: updatedRound, error } = await supabaseAdmin
      .from('rounds')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated_test: updatedRound });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
