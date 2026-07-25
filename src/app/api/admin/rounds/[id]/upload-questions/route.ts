import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { formatImageUrl } from '@/lib/utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Questions array is required' }, { status: 400 });
    }

    const formatted = questions.map((q: Record<string, any>, index: number) => {
      const rawImage =
        q.image_url ||
        q['Image Link / Drive URL'] ||
        q['Image Link'] ||
        q['Drive Link'] ||
        q['Image URL'] ||
        q['Figure'] ||
        q['Image'] ||
        null;

      const formattedImage = rawImage ? formatImageUrl(String(rawImage)) : null;

      return {
        round_id: id,
        question_type: q.question_type || q['Question Type'] || 'mcq',
        question_text: q.question_text || q['Question Text'] || q['Questions'] || '',
        options: q.options || (q['option 1'] ? [q['option 1'], q['option 2'], q['option 3'], q['option 4']].filter(Boolean) : null),
        correct_answer: q.correct_answer || { type: 'mcq', value: (Number(q['Correct Option (1-4)']) || 1) - 1 },
        marks: Number(q.marks || q['Marks'] || 1),
        negative_marks: Number(q.negative_marks || q['Negative Marks'] || 0),
        image_url: formattedImage,
        image_alt: formattedImage ? `Circuit Schematic ${index + 1}` : null,
        category: q.category || q['Category'] || null,
        difficulty: q.difficulty || q['Difficulty'] || 'medium',
        explanation: q.explanation || q['Explanation'] || null,
        order_index: index,
      };
    });

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert(formatted)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      questions: data,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
