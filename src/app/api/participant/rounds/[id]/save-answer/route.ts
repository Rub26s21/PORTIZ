import { NextRequest, NextResponse } from 'next/server';
import { requireParticipant, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireParticipant(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: roundId } = await params;

  try {
    const body = await req.json();
    const { questionId, selectedAnswer } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    // Get attempt
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .select('id, status')
      .eq('user_id', auth.user.id)
      .eq('round_id', roundId)
      .eq('status', 'in_progress')
      .single();

    if (!attempt) {
      return NextResponse.json({ error: 'No active attempt found' }, { status: 404 });
    }

    // Upsert response
    const { error } = await supabaseAdmin
      .from('responses')
      .upsert(
        {
          attempt_id: attempt.id,
          question_id: questionId,
          selected_answer: selectedAnswer,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id,question_id' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
