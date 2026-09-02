import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  let query = supabaseAdmin.from('questions').select('*').order('created_at', { ascending: false });

  if (id && id !== 'all' && id !== 'default' && id !== 'undefined') {
    query = query.eq('round_id', id);
  }

  const { data: questions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: questions || [] });
}

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
    let roundIdToUse = body.round_id || id;

    if (!roundIdToUse || roundIdToUse === 'all' || roundIdToUse === 'default' || roundIdToUse === 'undefined') {
      const { data: defaultRound } = await supabaseAdmin
        .from('rounds')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (defaultRound) {
        roundIdToUse = defaultRound.id;
      } else {
        const { data: newRound } = await supabaseAdmin
          .from('rounds')
          .insert({
            round_number: 1,
            title: 'Question Bank Pool',
            duration_minutes: 45,
            status: 'draft',
          })
          .select('id')
          .single();
        if (newRound) roundIdToUse = newRound.id;
      }
    }

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .insert({ ...body, round_id: roundIdToUse })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { questionId, ...updateData } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ question });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const questionId = url.searchParams.get('questionId');

  if (!questionId) {
    return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('questions').delete().eq('id', questionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
