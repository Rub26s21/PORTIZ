import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attempt_id');

    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attempt_id' }, { status: 400 });
    }

    // 1. Fetch attempt and round data using supabaseAdmin (bypassing anon RLS)
    const { data: att, error: attErr } = await supabaseAdmin
      .from('attempts')
      .select('id, participant_id, round_id, status, started_at, question_order, disqualified, disqualification_reason, rounds(title, duration_minutes, total_questions)')
      .eq('id', attemptId)
      .maybeSingle();

    if (attErr || !att) {
      return NextResponse.json({ error: 'Attempt session not found' }, { status: 404 });
    }

    // 2. Fetch saved responses
    const { data: savedResp } = await supabaseAdmin
      .from('responses')
      .select('question_id, selected')
      .eq('attempt_id', attemptId);

    const answersMap: Record<string, string> = {};
    (savedResp || []).forEach((r) => {
      if (r.selected !== null && r.selected !== undefined) {
        answersMap[r.question_id] = String(r.selected);
      }
    });

    // 3. Fetch participant name
    let participantName = 'Participant';
    if (att.participant_id) {
      const { data: part } = await supabaseAdmin
        .from('participants')
        .select('name, register_no')
        .eq('id', att.participant_id)
        .maybeSingle();

      if (part?.name) {
        participantName = part.name;
      }
    }

    const rData = (att as any).rounds;

    let questionOrder: string[] = att.question_order || [];
    if (questionOrder.length > 50) {
      questionOrder = questionOrder.slice(0, 50);
    }

    return NextResponse.json({
      attempt: {
        id: att.id,
        status: att.status,
        started_at: att.started_at,
        disqualified: att.disqualified,
        disqualification_reason: att.disqualification_reason,
        question_order: questionOrder,
      },
      round: {
        id: att.round_id,
        title: rData?.title || 'Competition Assessment',
        duration_minutes: rData?.duration_minutes || 30,
        total_questions: rData?.total_questions || questionOrder.length || 50,
      },
      participantName,
      answersMap,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
