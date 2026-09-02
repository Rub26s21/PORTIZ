'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import GlassCard from '@/components/shared/GlassCard';
import GalaxyButton from '@/components/shared/GalaxyButton';
import FadeIn from '@/components/shared/FadeIn';
import { formatDateIST } from '@/lib/utils';
import { ArrowLeft, Activity, ShieldAlert, Users, Radio, AlertOctagon } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LiveMonitoringPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const roundId = resolvedParams.id;

  const [roundTitle, setRoundTitle] = useState('');
  const [liveAttempts, setLiveAttempts] = useState<any[]>([]);
  const [proctorEvents, setProctorEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveData = useCallback(async () => {
    const roundRes = await supabase.from('rounds').select('title').eq('id', roundId).single();
    if (roundRes.data) setRoundTitle(roundRes.data.title);

    const { data: attempts } = await supabase
      .from('attempts')
      .select('id, status, created_at, violation_count, answered_count, profiles(display_name, register_number), participants(name, register_no)')
      .eq('round_id', roundId);

    setLiveAttempts(attempts || []);

    const { data: events } = await supabase
      .from('proctor_events')
      .select('id, event_type, created_at, details, attempts(profiles(display_name, register_number), participants(name, register_no))')
      .order('created_at', { ascending: false })
      .limit(15);

    setProctorEvents(events || []);
    setLoading(false);
  }, [roundId]);

  useEffect(() => {
    fetchLiveData();

    // Subscribe to Postgres changes for realtime proctoring
    const channel = supabase
      .channel('proctor-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts' }, () => fetchLiveData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proctor_events' }, () => fetchLiveData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLiveData]);

  const inProgressCount = liveAttempts.filter(a => a.status === 'in_progress').length;
  const dqCount = liveAttempts.filter(a => a.status === 'disqualified').length;
  const skeuomorphicShadow = '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.45), 0 1px 60px rgba(168,85,247,0.04), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.25), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(0,0,0,0.08)';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto relative z-10">

      {/* HEADER */}
      <FadeIn delay={0}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/admin/rounds/${roundId}`}>
              <button className="w-10 h-10 rounded-xl bg-[var(--glass-white)] hover:bg-[var(--glass-purple)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-[family-name:var(--font-heading)] font-bold bg-[rgba(244,63,94,0.2)] border border-[rgba(244,63,94,0.4)] text-[var(--aurora-rose)] uppercase animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--aurora-rose)] animate-pulse" /> LIVE PROCTORING
                </span>
              </div>
              <h1 className="font-[family-name:var(--font-display)] font-extrabold text-2xl md:text-3xl gradient-text">
                Live Round Monitor
              </h1>
            </div>
          </div>
        </div>

        <div className="h-[1px] w-full mt-4 bg-gradient-to-r from-transparent via-[rgba(244,63,94,0.4)] to-transparent" />
      </FadeIn>

      {/* METRICS */}
      <FadeIn delay={0.06}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard variant="elevated" radius={18} hover={false} noHover className="!p-5 border border-[rgba(6,182,212,0.25)] flex items-center gap-4" style={{ boxShadow: skeuomorphicShadow }}>
            <div className="w-12 h-12 rounded-2xl bg-[rgba(6,182,212,0.15)] border border-[rgba(6,182,212,0.3)] flex items-center justify-center text-[var(--aurora-cyan)]">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-[var(--aurora-cyan)] block">
                {inProgressCount}
              </span>
              <span className="font-[family-name:var(--font-heading)] text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                Exams Active Now
              </span>
            </div>
          </GlassCard>

          <GlassCard variant="elevated" radius={18} hover={false} noHover className="!p-5 border border-[rgba(16,185,129,0.25)] flex items-center gap-4" style={{ boxShadow: skeuomorphicShadow }}>
            <div className="w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center text-[var(--aurora-green)]">
              <Users size={22} />
            </div>
            <div>
              <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-[var(--aurora-green)] block">
                {liveAttempts.length}
              </span>
              <span className="font-[family-name:var(--font-heading)] text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                Total Enrolled
              </span>
            </div>
          </GlassCard>

          <GlassCard variant="elevated" radius={18} hover={false} noHover className="!p-5 border border-[rgba(244,63,94,0.25)] flex items-center gap-4" style={{ boxShadow: skeuomorphicShadow }}>
            <div className="w-12 h-12 rounded-2xl bg-[rgba(244,63,94,0.15)] border border-[rgba(244,63,94,0.3)] flex items-center justify-center text-[var(--aurora-rose)]">
              <AlertOctagon size={22} />
            </div>
            <div>
              <span className="font-[family-name:var(--font-mono)] font-bold text-2xl text-[var(--aurora-rose)] block">
                {dqCount}
              </span>
              <span className="font-[family-name:var(--font-heading)] text-xs text-[var(--text-muted)] uppercase tracking-wider block">
                Disqualified
              </span>
            </div>
          </GlassCard>
        </div>
      </FadeIn>

      {/* MONITOR GRID */}
      <FadeIn delay={0.12}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ACTIVE ATTEMPTS TABLE (8 COL) */}
          <div className="lg:col-span-8">
            <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-0 border border-[rgba(255,255,255,0.07)]" style={{ boxShadow: skeuomorphicShadow }}>
              <div className="p-4 px-5 border-b border-[rgba(255,255,255,0.05)] font-[family-name:var(--font-display)] font-bold text-base gradient-text">
                Live Participant Session Monitor
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(168,85,247,0.16)] bg-[rgba(124,58,237,0.1)] font-[family-name:var(--font-heading)] text-xs text-[var(--aurora-purple)] uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Answers</th>
                      <th className="px-4 py-3 text-center">Violations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveAttempts.length === 0 ? (
                      <tr><td colSpan={4} className="py-12 text-center text-xs text-[var(--text-dim)]">No active sessions right now.</td></tr>
                    ) : (
                      liveAttempts.map((att) => (
                        <tr key={att.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(168,85,247,0.04)] transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-[family-name:var(--font-body)] font-semibold text-xs text-[var(--text-primary)] block">
                              {att.profiles?.display_name || 'Student'}
                            </span>
                            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)]">
                              {att.profiles?.register_number || '22EC000'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {att.status === 'in_progress' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(6,182,212,0.2)] text-[var(--aurora-cyan)] border border-[rgba(6,182,212,0.4)] animate-pulse">EXAM ACTIVE</span>
                            ) : att.status === 'disqualified' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(244,63,94,0.2)] text-[var(--aurora-rose)] border border-[rgba(244,63,94,0.4)]">DISQUALIFIED</span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[rgba(16,185,129,0.2)] text-[var(--aurora-green)] border border-[rgba(16,185,129,0.4)]">SUBMITTED</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-[family-name:var(--font-mono)] text-xs text-[var(--aurora-gold)] text-center font-bold">
                            {att.answered_count || 0}
                          </td>
                          <td className="px-4 py-3.5 font-[family-name:var(--font-mono)] text-xs text-[var(--aurora-rose)] text-center font-bold">
                            {att.violation_count || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* REALTIME PROCTOR FEED (4 COL) */}
          <div className="lg:col-span-4">
            <GlassCard variant="solid" radius={24} hover={false} noHover className="!p-0 border border-[rgba(244,63,94,0.2)] h-[400px] flex flex-col overflow-hidden" style={{ boxShadow: skeuomorphicShadow }}>
              <div className="p-4 border-b border-[rgba(244,63,94,0.2)] font-[family-name:var(--font-display)] font-bold text-sm text-[var(--aurora-rose)] flex items-center gap-2">
                <ShieldAlert size={16} /> Live Proctoring Event Feed
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                {proctorEvents.length === 0 ? (
                  <div className="text-center py-16 text-xs text-[var(--text-dim)] font-light">
                    No proctoring violations detected.
                  </div>
                ) : (
                  proctorEvents.map((ev) => (
                    <div key={ev.id} className="p-2.5 rounded-xl bg-[rgba(244,63,94,0.06)] border border-[rgba(244,63,94,0.2)] text-xs font-[family-name:var(--font-body)]">
                      <div className="flex justify-between items-start text-[var(--aurora-rose)] font-semibold mb-1">
                        <span>{ev.event_type}</span>
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--text-dim)]">
                          {formatDateIST(ev.created_at).split(',')[1]}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-[11px] font-light">
                        {ev.attempts?.profiles?.display_name} ({ev.attempts?.profiles?.register_number})
                      </p>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>

        </div>
      </FadeIn>

    </div>
  );
}
