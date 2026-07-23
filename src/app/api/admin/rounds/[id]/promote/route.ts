import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { userIds, nextRoundId } = body;

    if (!Array.isArray(userIds) || userIds.length === 0 || !nextRoundId) {
      return NextResponse.json({ error: 'userIds array and nextRoundId are required' }, { status: 400 });
    }

    const eligibilityRows = userIds.map((userId: string) => ({
      round_id: nextRoundId,
      user_id: userId,
    }));

    const { data, error } = await supabaseAdmin
      .from('round_eligibility')
      .upsert(eligibilityRows, { onConflict: 'round_id,user_id' })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      promoted: data?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
