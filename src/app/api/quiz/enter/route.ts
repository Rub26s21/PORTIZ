import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, register_no, email, phone, round_id } = body;

    if (!name || !register_no || !email) {
      return NextResponse.json(
        { error: 'Missing required fields (name, register_no, email)' },
        { status: 400 }
      );
    }

    const regNoUpper = register_no.trim().toUpperCase();

    // 1. Fetch active/live/published round
    let roundIdToUse = round_id;
    let targetRound = null;

    if (roundIdToUse) {
      const { data: round } = await supabaseAdmin
        .from('rounds')
        .select('id, status, randomize_questions, show_results')
        .eq('id', roundIdToUse)
        .maybeSingle();

      targetRound = round;
    }

    if (!targetRound) {
      // Find any live/active/published round
      const { data: liveRound } = await supabaseAdmin
        .from('rounds')
        .select('id, status, randomize_questions, show_results')
        .in('status', ['active', 'live', 'published', 'ongoing'])
        .order('round_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      targetRound = liveRound;
      if (liveRound) {
        roundIdToUse = liveRound.id;
      }
    }

    if (!targetRound || !roundIdToUse) {
      // Return waiting state response if no round is live
      return NextResponse.json({
        waiting: true,
        message: 'No competition round is currently active. Please wait for host to start the round.'
      });
    }

    // 2. Upsert participant in participants table
    const { data: participant, error: partErr } = await supabaseAdmin
      .from('participants')
      .upsert(
        {
          name: name.trim(),
          register_no: regNoUpper,
          email: email.trim(),
          phone: phone ? phone.trim() : null,
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
    }

    // 3. Check for existing attempt
    const { data: existingAttempt } = await supabaseAdmin
      .from('attempts')
      .select('id, status, score')
      .eq('participant_id', participantId)
      .eq('round_id', roundIdToUse)
      .maybeSingle();

    if (existingAttempt) {
      return NextResponse.json({
        alreadyAttempted: true,
        attempt_id: existingAttempt.id,
        status: existingAttempt.status,
        score: targetRound.show_results ? existingAttempt.score : null,
      });
    }

    // 4. Fetch question IDs for this round
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, order_index')
      .eq('round_id', roundIdToUse)
      .order('order_index', { ascending: true });

    let questionOrderIds = (questions || []).map((q) => q.id);

    // Shuffle if round config specifies randomize_questions
    if (targetRound.randomize_questions && questionOrderIds.length > 1) {
      for (let i = questionOrderIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionOrderIds[i], questionOrderIds[j]] = [questionOrderIds[j], questionOrderIds[i]];
      }
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
      round_id: round_id,
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
