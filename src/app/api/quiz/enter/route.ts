import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MASTER_QUESTION_POOL } from '@/lib/question-seed';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: NextRequest) {
  try {
    // 0. Rate Limiting: Max 10 attempts per minute per IP
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`enter:${clientIp}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { name, register_no, email, phone, round_id, section } = body;

    if (!name || !register_no || !email) {
      return NextResponse.json(
        { error: 'Missing required fields (name, register_no, email)' },
        { status: 400 }
      );
    }

    const regNoUpper = register_no.trim().toUpperCase();
    let studentSection = (section || '').trim().toUpperCase();

    // Ensure valid section 'A' | 'B' | 'C' | 'D'
    if (!['A', 'B', 'C', 'D'].includes(studentSection)) {
      const match = regNoUpper.match(/922524106(\d{3})/);
      if (match) {
        const roll = parseInt(match[1], 10);
        if (roll >= 1 && roll <= 60) studentSection = 'A';
        else if (roll >= 61 && roll <= 120) studentSection = 'B';
        else if (roll >= 121 && roll <= 180) studentSection = 'C';
        else studentSection = 'D';
      } else {
        studentSection = 'A';
      }
    }

    // 1. Fetch active/live/published round
    let roundIdToUse = round_id;
    let targetRound: any = null;

    if (roundIdToUse) {
      const { data: round } = await supabaseAdmin
        .from('rounds')
        .select('id, status, title, description, randomize_questions, show_results')
        .eq('id', roundIdToUse)
        .maybeSingle();

      if (round) {
        // Cross-section mismatch check: If round is explicitly named for a DIFFERENT section, reject it
        const t = (round.title + ' ' + (round.description || '')).toUpperCase();
        const hasOtherSection = ['A', 'B', 'C', 'D'].some(
          (s) => s !== studentSection && (t.includes(`SECTION ${s}`) || t.includes(`SEC ${s}`))
        );
        if (!hasOtherSection) {
          targetRound = round;
        } else {
          // Explicit mismatch! Reroute to student's proper section round
          roundIdToUse = null;
        }
      }
    }

    // 1b. Search for live/active/published rounds matching student's section
    if (!targetRound) {
      const { data: liveRounds } = await supabaseAdmin
        .from('rounds')
        .select('id, status, title, description, randomize_questions, show_results, round_number')
        .in('status', ['active', 'live', 'published', 'ongoing'])
        .order('round_number', { ascending: true });

      if (liveRounds && liveRounds.length > 0) {
        // 1. Prioritize round matching student's section (e.g. Section A, Section B, Section C, Section D)
        const sectionMatch = liveRounds.find((r) => {
          const t = (r.title + ' ' + (r.description || '')).toUpperCase();
          return t.includes(`SECTION ${studentSection}`) || t.includes(`SEC ${studentSection}`);
        });

        // 2. Or active Sample / Demo Test
        const demoMatch = liveRounds.find((r) => {
          const t = (r.title + ' ' + (r.description || '')).toLowerCase();
          return t.includes('demo') || t.includes('sample');
        });

        // 3. Or general live round without conflicting section name
        const generalMatch = liveRounds.find((r) => {
          const t = (r.title + ' ' + (r.description || '')).toUpperCase();
          return !t.includes('SECTION A') && !t.includes('SECTION B') && !t.includes('SECTION C') && !t.includes('SECTION D');
        });

        targetRound = sectionMatch || demoMatch || generalMatch || null;
        if (targetRound) roundIdToUse = targetRound.id;
      }
    }

    // 1c. If still no active round found, find round specifically dedicated to this section in DB
    if (!targetRound) {
      const { data: secRounds } = await supabaseAdmin
        .from('rounds')
        .select('id, status, title, description, randomize_questions, show_results')
        .or(`title.ilike.%SECTION ${studentSection}%,description.ilike.%SECTION ${studentSection}%`)
        .order('round_number', { ascending: true })
        .limit(1);

      if (secRounds && secRounds.length > 0) {
        targetRound = secRounds[0];
        roundIdToUse = targetRound.id;

        // Auto-activate this section round to 'live'
        await supabaseAdmin
          .from('rounds')
          .update({ status: 'live' })
          .eq('id', targetRound.id);
      }
    }

    // 1d. Fallback to Demo round or auto-create section round
    if (!targetRound) {
      const { data: demoRound } = await supabaseAdmin
        .from('rounds')
        .select('id, status, title, description, randomize_questions, show_results')
        .eq('round_number', 0)
        .maybeSingle();

      if (demoRound) {
        targetRound = demoRound;
        roundIdToUse = demoRound.id;
      }
    }

    // 1e. If no rounds exist in DB at all, auto-create one for this exact section!
    if (!targetRound || !roundIdToUse) {
      const { data: createdRound, error: createErr } = await supabaseAdmin
        .from('rounds')
        .insert({
          round_number: 1,
          title: `Weekly Assessment #1 - Section ${studentSection}`,
          description: `Department Assessment (50 Questions | Section ${studentSection})`,
          duration_minutes: 45,
          status: 'live',
          randomize_questions: true,
          randomize_options: true,
          show_results: true,
        })
        .select()
        .single();

      if (createErr || !createdRound) {
        return NextResponse.json({
          error: 'No assessment is currently available. Please contact your coordinator.'
        }, { status: 500 });
      }

      targetRound = createdRound;
      roundIdToUse = createdRound.id;
    }

    // 2. Upsert participant in participants table WITH EXPLICIT SECTION PRESERVATION
    const { data: participant } = await supabaseAdmin
      .from('participants')
      .upsert(
        {
          name: name.trim(),
          register_no: regNoUpper,
          email: email.trim(),
          phone: phone ? phone.trim() : null,
          roll_number: studentSection,
          college: `Section ${studentSection}`,
          department: 'ECE',
        },
        { onConflict: 'register_no' }
      )
      .select('id')
      .single();

    let participantId = (participant as any)?.id;

    if (!participantId) {
      const { data: existingPart } = await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('register_no', regNoUpper)
        .maybeSingle();

      if (!existingPart) {
        return NextResponse.json({ error: 'Failed to record participant details' }, { status: 500 });
      }
      participantId = existingPart.id;

      // Update existing record with section
      await supabaseAdmin
        .from('participants')
        .update({
          roll_number: studentSection,
          college: `Section ${studentSection}`,
          department: 'ECE',
        })
        .eq('id', participantId);
    }

    // 3. Check for existing attempt
    const { data: existingAttempt } = await supabaseAdmin
      .from('attempts')
      .select('id, status, score, question_order')
      .eq('participant_id', participantId)
      .eq('round_id', roundIdToUse)
      .maybeSingle();

    if (existingAttempt) {
      if (existingAttempt.status === 'in_progress') {
        const response = NextResponse.json({
          attempt_id: existingAttempt.id,
          participant_id: participantId,
          round_id: roundIdToUse,
          resumed: true,
          question_count: existingAttempt.question_order?.length || 50,
        });

        response.cookies.set('participant_session', existingAttempt.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 86400,
          path: '/',
        });

        return response;
      }

      return NextResponse.json({
        alreadyAttempted: true,
        attempt_id: existingAttempt.id,
        participant_id: participantId,
        round_id: roundIdToUse,
        status: existingAttempt.status,
        score: targetRound.show_results ? existingAttempt.score : null,
      });
    }

    // 4. Fetch question IDs for this round
    let { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, order_index, subject_name, category')
      .eq('round_id', roundIdToUse)
      .order('order_index', { ascending: true });

    // 4b. Fallback: If round has 0 questions assigned, fetch all available questions or seed from master pool
    if (!questions || questions.length === 0) {
      const { data: allAvailableQs } = await supabaseAdmin
        .from('questions')
        .select('id, order_index, subject_name, category')
        .limit(200);

      if (allAvailableQs && allAvailableQs.length >= 50) {
        questions = allAvailableQs;
      } else {
        // Auto-seed from master pool
        const seedPayloads = MASTER_QUESTION_POOL.map((q, idx) => ({
          round_id: roundIdToUse,
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

        const { data: seededQs } = await supabaseAdmin
          .from('questions')
          .insert(seedPayloads)
          .select('id, order_index, subject_name, category');

        questions = seededQs || [];
      }
    }

    const rawQuestions = questions || [];
    const targetCount = 50;

    let selectedQIds: string[] = [];

    // Subject distribution balancing
    const subjectMap: Record<string, string[]> = {};
    rawQuestions.forEach((q) => {
      const sub = q.subject_name || q.category || 'General';
      if (!subjectMap[sub]) subjectMap[sub] = [];
      subjectMap[sub].push(q.id);
    });

    const subjects = Object.keys(subjectMap);
    if (subjects.length > 1 && rawQuestions.length > targetCount) {
      const perSubQuota = Math.floor(targetCount / subjects.length);
      const remainder = targetCount % subjects.length;

      subjects.forEach((sub, sIdx) => {
        const pool = [...subjectMap[sub]].sort(() => Math.random() - 0.5);
        const take = perSubQuota + (sIdx < remainder ? 1 : 0);
        selectedQIds.push(...pool.slice(0, take));
      });

      if (selectedQIds.length < targetCount) {
        const remaining = rawQuestions
          .map((q) => q.id)
          .filter((id) => !selectedQIds.includes(id))
          .sort(() => Math.random() - 0.5);
        selectedQIds.push(...remaining.slice(0, targetCount - selectedQIds.length));
      }
    } else {
      selectedQIds = rawQuestions.map((q) => q.id);
    }

    // Strictly enforce 50 questions limit per test
    if (selectedQIds.length > targetCount) {
      selectedQIds = selectedQIds.slice(0, targetCount);
    }

    let questionOrderIds = selectedQIds;

    // Shuffle if round config specifies randomize_questions (default true)
    if (targetRound.randomize_questions !== false && questionOrderIds.length > 1) {
      questionOrderIds = shuffleArray(questionOrderIds);
    }

    // 5. Create new attempt
    const { data: newAttempt, error: attemptErr } = await supabaseAdmin
      .from('attempts')
      .insert({
        participant_id: participantId,
        round_id: roundIdToUse,
        status: 'in_progress',
        question_order: questionOrderIds,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (attemptErr || !newAttempt) {
      return NextResponse.json({ error: 'Failed to initialize exam attempt' }, { status: 500 });
    }

    // 6. Create response cookie & json payload
    const response = NextResponse.json({
      attempt_id: newAttempt.id,
      participant_id: participantId,
      round_id: roundIdToUse,
      section: studentSection,
      question_count: questionOrderIds.length,
    });

    response.cookies.set('participant_session', newAttempt.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
