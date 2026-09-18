import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { formatImageUrl } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { questions, round_id } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Questions array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Resolve target round ID
    let targetRoundId = round_id;
    if (!targetRoundId || targetRoundId === 'bank' || targetRoundId === 'all' || targetRoundId === 'default') {
      const { data: defaultRound } = await supabaseAdmin
        .from('rounds')
        .select('id')
        .order('round_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (defaultRound) {
        targetRoundId = defaultRound.id;
      } else {
        const { data: newRound } = await supabaseAdmin
          .from('rounds')
          .insert({
            round_number: 1,
            title: 'Master Question Bank Pool',
            description: 'Central department question repository for automated test generation',
            duration_minutes: 45,
            status: 'draft',
          })
          .select('id')
          .single();

        if (newRound) targetRoundId = newRound.id;
      }
    }

    // Format all questions cleanly
    const formattedQuestions = questions.map((q: any, idx: number) => {
      const rawImage =
        q.image_url ||
        q['Image Link / Drive URL'] ||
        q['Image Link'] ||
        q['Drive Link'] ||
        q['Image URL'] ||
        q['Figure'] ||
        null;

      const formattedImage = rawImage ? formatImageUrl(String(rawImage)) : null;

      // Clean correct answer structure
      let correctAnswer = q.correct_answer;
      if (typeof correctAnswer === 'number') {
        correctAnswer = { type: q.question_type || 'mcq', value: correctAnswer };
      } else if (typeof correctAnswer === 'string' && !isNaN(Number(correctAnswer))) {
        correctAnswer = { type: q.question_type || 'mcq', value: Number(correctAnswer) };
      } else if (!correctAnswer || typeof correctAnswer !== 'object') {
        correctAnswer = { type: q.question_type || 'mcq', value: 0 };
      }

      return {
        round_id: q.round_id || targetRoundId,
        subject_id: q.subject_id || null,
        subject_name: q.subject_name || q.category || 'General',
        question_type: q.question_type || 'mcq',
        question_text: q.question_text || '',
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: correctAnswer,
        marks: Number(q.marks) || 2,
        negative_marks: Number(q.negative_marks) || 0.5,
        image_url: formattedImage,
        image_alt: formattedImage ? (q.image_alt || `Question Figure ${idx + 1}`) : null,
        category: q.category || q.subject_name || 'Electronics',
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || null,
        order_index: typeof q.order_index === 'number' ? q.order_index : idx + 1,
      };
    });

    // High throughput chunked insertion (chunks of 100 for safety and speed)
    const CHUNK_SIZE = 100;
    let insertedCount = 0;
    const subjectCounts: Record<string, number> = {};

    for (let i = 0; i < formattedQuestions.length; i += CHUNK_SIZE) {
      const chunk = formattedQuestions.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabaseAdmin
        .from('questions')
        .insert(chunk)
        .select('id, subject_name');

      if (error) {
        return NextResponse.json(
          {
            error: `Failed to insert batch ${Math.floor(i / CHUNK_SIZE) + 1}: ${error.message}`,
            inserted_so_far: insertedCount,
          },
          { status: 500 }
        );
      }

      if (data) {
        insertedCount += data.length;
        data.forEach((item) => {
          const sub = item.subject_name || 'General';
          subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_received: questions.length,
      inserted_count: insertedCount,
      target_round_id: targetRoundId,
      subject_counts: subjectCounts,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error processing bulk upload' },
      { status: 500 }
    );
  }
}
