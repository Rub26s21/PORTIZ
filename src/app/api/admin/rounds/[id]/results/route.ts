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

  const { data: attempts, error } = await supabaseAdmin
    .from('attempts')
    .select(`
      *,
      profiles:user_id (
        id, display_name, email, register_number, department, year
      )
    `)
    .eq('round_id', id)
    .order('score', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get violation counts per attempt
  const attemptIds = attempts?.map((a) => a.id) || [];
  let violationCounts: Record<string, number> = {};

  if (attemptIds.length > 0) {
    const { data: events } = await supabaseAdmin
      .from('proctor_events')
      .select('attempt_id')
      .in('attempt_id', attemptIds);

    if (events) {
      violationCounts = events.reduce((acc: Record<string, number>, e) => {
        acc[e.attempt_id] = (acc[e.attempt_id] || 0) + 1;
        return acc;
      }, {});
    }
  }

  const results = attempts?.map((a) => ({
    ...a,
    violations: violationCounts[a.id] || 0,
  }));

  return NextResponse.json({ results });
}
