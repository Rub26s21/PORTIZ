import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    // Optional Vercel Cron secret validation if configured in production env
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Find all scheduled test drafts whose start_time has arrived
    const { data: dueRounds, error: fetchErr } = await supabaseAdmin
      .from('rounds')
      .select('id, title, start_time, status')
      .in('status', ['draft', 'scheduled'])
      .lte('start_time', now);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!dueRounds || dueRounds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled tests due for live publishing at this time.',
        timestamp: now,
      });
    }

    const dueIds = dueRounds.map((r) => r.id);

    // Transition all due tests to 'live' status
    const { error: updateErr } = await supabaseAdmin
      .from('rounds')
      .update({
        status: 'live',
        started_at: now,
      })
      .in('id', dueIds);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Auto-published ${dueRounds.length} scheduled test(s) live!`,
      published_tests: dueRounds,
      timestamp: now,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Cron execution error' }, { status: 500 });
  }
}
