import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('id');
    const attemptId = searchParams.get('attempt_id');

    if (!questionId || !attemptId) {
      return NextResponse.json({ error: 'Missing id or attempt_id' }, { status: 400 });
    }

    // 1. Verify attempt is valid & active
    const { data: attempt, error: attErr } = await supabase
      .from('attempts')
      .select('id, status, disqualified')
      .eq('id', attemptId)
      .single();

    if (attErr || !attempt) {
      return NextResponse.json({ error: 'Invalid attempt session' }, { status: 403 });
    }

    if (attempt.disqualified || attempt.status === 'submitted') {
      return NextResponse.json({ error: 'Exam session completed or terminated' }, { status: 403 });
    }

    // 2. Fetch question without correct_answer
    const { data: question, error: qErr } = await supabase
      .from('questions')
      .select('id, question_text, question_type, options, image_url, image_alt, marks, negative_marks, category')
      .eq('id', questionId)
      .single();

    if (qErr || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // 3. Fetch existing answer for this question if previously saved
    const { data: savedResp } = await supabase
      .from('responses')
      .select('selected')
      .eq('attempt_id', attemptId)
      .eq('question_id', questionId)
      .single();

    return NextResponse.json({
      question: {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        image_url: question.image_url,
        image_alt: question.image_alt,
        marks: question.marks,
        negative_marks: question.negative_marks || 0,
        category: question.category,
      },
      savedAnswer: savedResp ? savedResp.selected : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
