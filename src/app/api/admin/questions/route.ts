import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const searchParams = req.nextUrl.searchParams;
  const roundId = searchParams.get('round_id');
  const subject = searchParams.get('subject');
  const questionType = searchParams.get('type');
  const search = searchParams.get('search');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(200, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;

  try {
    let query = supabaseAdmin
      .from('questions')
      .select('*, rounds(title, round_number)', { count: 'exact' });

    if (roundId && roundId !== 'all') {
      query = query.eq('round_id', roundId);
    }

    if (subject && subject !== 'all') {
      query = query.or(`subject_name.ilike.%${subject}%,category.ilike.%${subject}%`);
    }

    if (questionType && questionType !== 'all') {
      query = query.eq('question_type', questionType);
    }

    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`question_text.ilike.%${s}%,subject_name.ilike.%${s}%,category.ilike.%${s}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: questions, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      questions: questions || [],
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
