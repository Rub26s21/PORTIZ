import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const search = (url.searchParams.get('search') || '').toLowerCase();

  try {
    // 1. Fetch from participants table
    const { data: partData } = await supabaseAdmin
      .from('participants')
      .select('id, name, register_no, email, phone, created_at')
      .order('created_at', { ascending: false });

    // 2. Fetch from profiles table (registered users)
    const { data: profData } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, register_number, email, phone, created_at')
      .eq('role', 'participant')
      .order('created_at', { ascending: false });

    const combinedMap = new Map<string, any>();

    // Add profiles
    (profData || []).forEach((prof) => {
      const regKey = (prof.register_number || prof.id).toUpperCase();
      combinedMap.set(regKey, {
        id: prof.id,
        name: prof.display_name || 'Student',
        register_no: prof.register_number || 'N/A',
        email: prof.email || '',
        phone: prof.phone || '',
        created_at: prof.created_at,
        isProfile: true,
      });
    });

    // Add / overwrite with direct participants (has accurate attempts)
    (partData || []).forEach((part) => {
      const regKey = (part.register_no || part.id).toUpperCase();
      const existing = combinedMap.get(regKey) || {};
      combinedMap.set(regKey, {
        ...existing,
        id: part.id,
        name: part.name || existing.name || 'Student',
        register_no: part.register_no || existing.register_no || 'N/A',
        email: part.email || existing.email || '',
        phone: part.phone || existing.phone || '',
        created_at: part.created_at || existing.created_at,
        participant_id: part.id,
      });
    });

    const combinedList = Array.from(combinedMap.values());

    // 3. Enrich with attempts count & best score
    const enriched = await Promise.all(
      combinedList.map(async (p) => {
        let attemptsQuery = supabaseAdmin.from('attempts').select('score, status');
        if (p.participant_id) {
          attemptsQuery = attemptsQuery.eq('participant_id', p.participant_id);
        } else if (p.isProfile) {
          attemptsQuery = attemptsQuery.eq('user_id', p.id);
        }

        const { data: attempts } = await attemptsQuery;

        const attemptsCount = (attempts || []).length;
        const bestScore = (attempts || []).reduce((max, a) => Math.max(max, a.score || 0), 0);

        return {
          ...p,
          attempts_count: attemptsCount,
          best_score: bestScore,
        };
      })
    );

    // 4. Apply search filter
    const filtered = enriched.filter((p) => {
      if (!search) return true;
      return (
        p.name?.toLowerCase().includes(search) ||
        p.register_no?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search) ||
        p.phone?.includes(search)
      );
    });

    return NextResponse.json({ participants: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
