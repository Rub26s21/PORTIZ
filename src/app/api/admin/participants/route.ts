import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const department = url.searchParams.get('department') || '';
  const year = url.searchParams.get('year') || '';

  let query = supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('role', 'participant')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,register_number.ilike.%${search}%`);
  }

  if (department) {
    query = query.eq('department', department);
  }

  if (year) {
    query = query.eq('year', year);
  }

  const { data: participants, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ participants });
}
