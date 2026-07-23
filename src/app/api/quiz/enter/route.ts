import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, register_no, email, phone, round_id } = body;

    if (!name || !register_no || !phone || !round_id) {
      return NextResponse.json(
        { error: 'Missing required fields (name, register_no, phone, round_id)' },
        { status: 400 }
      );
    }

    const regNoUpper = register_no.trim().toUpperCase();

    // 1. Check if round exists and is LIVE
    const { data: round, error: roundErr } = await supabase
      .from('rounds')
      .select('id, status, randomize_questions, show_results')
      .eq('id', round_id)
      .single();

    if (roundErr || !round) {
      return NextResponse.json({ error: 'Competition round not found' }, { status: 404 });
    }

    if (round.status !== 'live') {
      return NextResponse.json({ error: 'This round is not currently live' }, { status: 400 });
    }

    // 2. Upsert participant in participants table
    const { data: participant, error: partErr } = await supabase
      .from('participants')
      .upsert(
        {
          name: name.trim(),
          register_no: regNoUpper,
          email: email ? email.trim() : null,
          phone: phone.trim(),
        },
        { onConflict: 'register_no' }
      )
      .select('id')
      .single();

    let participantId = (participant as any)?.id;

    if (!participantId) {
      const { data: existingPart } = await supabase
        .from('participants')
        .select('id')
        .eq('register_no', regNoUpper)
        .single();

      if (!existingPart) {
        return NextResponse.json({ error: 'Failed to record participant details' }, { status: 500 });
      }
      participantId = existingPart.id;
    }

    // 3. Check for existing attempt
    const { data: existingAttempt } = await supabase
      .from('attempts')
      .select('id, status, score')
      .eq('participant_id', participantId)
      .eq('round_id', round_id)
      .single();

    if (existingAttempt) {
      return NextResponse.json({
        alreadyAttempted: true,
        attempt_id: existingAttempt.id,
        status: existingAttempt.status,
        score: round.show_results ? existingAttempt.score : null,
      });
    }

    // 4. Fetch question IDs for this round
    const { data: questions } = await supabase
      .from('questions')
      .select('id, order_index')
      .eq('round_id', round_id)
      .order('order_index', { ascending: true });

    let questionOrderIds = (questions || []).map((q) => q.id);

    // Shuffle if round config specifies randomize_questions
    if (round.randomize_questions && questionOrderIds.length > 1) {
      for (let i = questionOrderIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionOrderIds[i], questionOrderIds[j]] = [questionOrderIds[j], questionOrderIds[i]];
      }
    }

    // 5. Create new attempt
    const { data: newAttempt, error: attemptErr } = await supabase
      .from('attempts')
      .insert({
        participant_id: participantId,
        round_id: round_id,
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
